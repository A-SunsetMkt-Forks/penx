import { IPFS_ADD_URL, PostStatus } from '@/lib/constants'
import { INode, NodeType } from '@/lib/model'
import { prisma } from '@/lib/prisma'
import { GateType, Node, PostType, Prisma } from '@prisma/client'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from '../trpc'

export const nodeRouter = router({
  myNodes: protectedProcedure.query(async ({ ctx, input }) => {
    const nodes = await prisma.node.findMany({
      where: { userId: ctx.token.uid },
    })
    return nodes
  }),

  sync: protectedProcedure
    .input(
      z.object({
        nodes: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newNodes: INode[] = JSON.parse(input.nodes)
      if (!newNodes?.length) return null

      return prisma.$transaction(
        async (tx) => {
          let nodes: Node[] = []
          const userId = ctx.token.uid

          if (isAllNodes(newNodes)) {
            // console.log('sync all===================')
            await tx.node.deleteMany({ where: { userId } })
            await tx.node.createMany({ data: newNodes })
          } else {
            // console.log('sync diff==================')
            let todayNode: Node

            nodes = await tx.node.findMany({ where: { userId } })

            todayNode = nodes.find(
              (n) =>
                n.date === format(new Date(), 'yyyy-MM-dd') &&
                n.type === NodeType.DAILY,
            )!

            if (isNodesBroken(nodes as INode[])) {
              throw new Error('NODES_BROKEN')
            }

            const nodeIdsSet = new Set(nodes.map((node) => node.id))

            const updatedNodes: INode[] = []
            const addedNodes: INode[] = []

            for (const n of newNodes) {
              if (nodeIdsSet.has(n.id)) {
                updatedNodes.push(n)
              } else {
                addedNodes.push(n)
              }
            }

            // TODO:
            const isTodayNode = false

            const newAddedNodes = isTodayNode
              ? addedNodes.map((n) => ({
                  ...n,
                  parentId: todayNode.id,
                }))
              : addedNodes

            await tx.node.createMany({ data: newAddedNodes })

            if (isTodayNode) {
              await tx.node.update({
                where: { id: todayNode.id },
                data: {
                  children: [
                    ...(todayNode.children as any),
                    ...addedNodes.map((n) => n.id),
                  ],
                },
              })
            }

            // console.log('=============todayNode:', todayNode)

            const promises = updatedNodes.map((n) => {
              return tx.node.update({ where: { id: n.id }, data: n })
            })

            await Promise.all(promises)
          }

          // TODO: should clean no used nodes
          nodes = await tx.node.findMany({
            where: { userId },
          })

          await cleanDeletedNodes(nodes as any, async (id) => {
            tx.node.delete({
              where: { id },
            })
          })

          return true
        },
        {
          maxWait: 1000 * 60, // default: 2000
          timeout: 1000 * 60, // default: 5000
        },
      )
    }),
})

function isAllNodes(nodes: INode[]) {
  const set = new Set([
    NodeType.ROOT,
    NodeType.DATABASE_ROOT,
    NodeType.DAILY_ROOT,
  ])

  for (const node of nodes) {
    if (set.has(node.type)) set.delete(node.type)
  }

  return set.size === 0
}

function isNodesBroken(nodes: INode[]) {
  const set = new Set([
    NodeType.ROOT,
    NodeType.DATABASE_ROOT,
    NodeType.DAILY_ROOT,
  ])

  for (const node of nodes) {
    if (set.has(node.type)) set.delete(node.type)
  }

  return set.size !== 0
}

async function cleanDeletedNodes(
  nodes: INode[],
  deleteNode: (id: string) => Promise<void>,
) {
  const nodeMap = new Map<string, INode>()

  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  for (const node of nodes) {
    // TODO: need improvement
    if (
      [
        NodeType.DATABASE,
        // NodeType.COLUMN,
        // NodeType.ROW,
        // NodeType.VIEW,
        // NodeType.CELL,
        NodeType.ROOT,
        NodeType.DAILY_ROOT,
        NodeType.DATABASE_ROOT,
      ].includes(node.type as NodeType)
    ) {
      continue
    }

    // if (!Reflect.has(node, 'parentId')) continue
    if (!node.parentId) continue

    const parentNode = nodeMap.get(node.parentId)
    const children = (parentNode?.children || []) as string[]

    if (!children.includes(node.id)) {
      // console.log('=======clear node!!!!', node, JSON.stringify(node.element))
      await deleteNode(node.id)
    }
  }
}