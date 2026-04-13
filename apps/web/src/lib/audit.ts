import prisma from "./prisma";

export async function createAuditLog(params: {
  businessId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}) {
  return prisma.auditLog.create({
    data: {
      businessId: params.businessId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
    },
  });
}
