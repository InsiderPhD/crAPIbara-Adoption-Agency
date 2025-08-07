import { PrismaClient, RescueRequest as PrismaRescueRequest } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for rescue request validation
export const rescueRequestSchema = z.object({
  reason: z.string().min(1).max(1000),
  rescueName: z.string().min(1).max(150),
  rescueLocation: z.string().min(1).max(255),
  couponCode: z.string().max(50).optional(),
});

export type RescueRequestFormData = z.infer<typeof rescueRequestSchema>;

export interface RescueRequest extends PrismaRescueRequest {}

export class RescueRequestModel {
  static async create(data: Omit<RescueRequest, 'id' | 'requestDate' | 'status' | 'requiredFee' | 'amountPaid' | 'approvalDate' | 'adminNotes' | 'createdAt' | 'updatedAt'>): Promise<RescueRequest> {
    const request = await prisma.rescueRequest.create({
      data: {
        userId: data.userId,
        reason: data.reason,
        rescueName: data.rescueName,
        rescueLocation: data.rescueLocation,
        couponCode: data.couponCode,
        requiredFee: 0, // This should be calculated based on business logic
        amountPaid: 0,
        status: 'pending',
      }
    });
    return request;
  }

  static async findById(id: string): Promise<RescueRequest | null> {
    const request = await prisma.rescueRequest.findUnique({
      where: { id }
    });
    return request;
  }

  static async findByUserId(userId: string): Promise<RescueRequest[]> {
    const requests = await prisma.rescueRequest.findMany({
      where: { userId },
      orderBy: { requestDate: 'desc' }
    });
    return requests;
  }

  static async findAll(status?: string): Promise<RescueRequest[]> {
    const requests = await prisma.rescueRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestDate: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });
    return requests;
  }

  static async updateStatus(id: string, status: string, adminNotes?: string): Promise<RescueRequest | null> {
    const request = await prisma.rescueRequest.update({
      where: { id },
      data: {
        status,
        adminNotes,
        approvalDate: status === 'approved' ? new Date() : undefined
      }
    });
    return request;
  }

  static async updatePayment(id: string, amountPaid: number): Promise<RescueRequest | null> {
    const request = await prisma.rescueRequest.update({
      where: { id },
      data: {
        amountPaid,
        status: amountPaid >= 0 ? 'payment_pending' : 'pending'
      }
    });
    return request;
  }

  static async delete(id: string): Promise<RescueRequest | null> {
    const request = await prisma.rescueRequest.delete({
      where: { id }
    });
    return request;
  }
} 