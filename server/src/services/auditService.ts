import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(data: AuditLogData) {
    try {
      // Ensure details are properly serialized
      let serializedDetails = null;
      if (data.details) {
        try {
          // If it's already a string, use it as is
          if (typeof data.details === 'string') {
            serializedDetails = data.details;
          } else {
            // Otherwise, stringify it
            serializedDetails = JSON.stringify(data.details, null, 2);
          }
        } catch (serializeError) {
          console.error('Failed to serialize audit log details:', serializeError);
          serializedDetails = JSON.stringify({ error: 'Failed to serialize details', original: String(data.details) });
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          details: serializedDetails,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  // Convenience methods for common actions
  static async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'login',
      ipAddress,
      userAgent,
    });
  }

  static async logLogout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'logout',
      ipAddress,
      userAgent,
    });
  }

  static async logPetCreated(userId: string, petId: string, petName: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'pet_created',
      entityType: 'pet',
      entityId: petId,
      details: { petName },
      ipAddress,
      userAgent,
    });
  }

  static async logPetUpdated(userId: string, petId: string, petName: string, changes: any, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'pet_updated',
      entityType: 'pet',
      entityId: petId,
      details: { petName, changes },
      ipAddress,
      userAgent,
    });
  }

  static async logPetDeleted(userId: string, petId: string, petName: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'pet_deleted',
      entityType: 'pet',
      entityId: petId,
      details: { petName },
      ipAddress,
      userAgent,
    });
  }

  static async logApplicationSubmitted(userId: string, applicationId: string, petId: string, petName: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'application_submitted',
      entityType: 'application',
      entityId: applicationId,
      details: { petId, petName },
      ipAddress,
      userAgent,
    });
  }

  static async logApplicationApproved(userId: string, applicationId: string, petId: string, petName: string, approvedBy: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'application_approved',
      entityType: 'application',
      entityId: applicationId,
      details: { petId, petName, approvedBy },
      ipAddress,
      userAgent,
    });
  }

  static async logApplicationRejected(userId: string, applicationId: string, petId: string, petName: string, rejectedBy: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'application_rejected',
      entityType: 'application',
      entityId: applicationId,
      details: { petId, petName, rejectedBy },
      ipAddress,
      userAgent,
    });
  }

  static async logRescueRequestSubmitted(userId: string, requestId: string, rescueName: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'rescue_request_submitted',
      entityType: 'rescue_request',
      entityId: requestId,
      details: { rescueName },
      ipAddress,
      userAgent,
    });
  }

  static async logRescueRequestApproved(userId: string, requestId: string, rescueName: string, approvedBy: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'rescue_request_approved',
      entityType: 'rescue_request',
      entityId: requestId,
      details: { rescueName, approvedBy },
      ipAddress,
      userAgent,
    });
  }

  static async logRescueRequestRejected(userId: string, requestId: string, rescueName: string, rejectedBy: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'rescue_request_rejected',
      entityType: 'rescue_request',
      entityId: requestId,
      details: { rescueName, rejectedBy },
      ipAddress,
      userAgent,
    });
  }

  static async logUserCreated(createdBy: string, userId: string, username: string, role: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId: createdBy,
      action: 'user_created',
      entityType: 'user',
      entityId: userId,
      details: { username, role },
      ipAddress,
      userAgent,
    });
  }

  static async logUserUpdated(updatedBy: string, userId: string, username: string, changes: any, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId: updatedBy,
      action: 'user_updated',
      entityType: 'user',
      entityId: userId,
      details: { username, changes },
      ipAddress,
      userAgent,
    });
  }

  static async logUserDeleted(deletedBy: string, userId: string, username: string, role: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId: deletedBy,
      action: 'user_deleted',
      entityType: 'user',
      entityId: userId,
      details: { username, role },
      ipAddress,
      userAgent,
    });
  }

  static async logAdminAction(adminId: string, action: string, entityType: string, entityId: string, details: any, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId: adminId,
      action: `admin_${action}`,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  }

  static async logPetPromotion(userId: string, petId: string, petName: string, amount: number, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'pet_promotion_purchased',
      entityType: 'pet',
      entityId: petId,
      details: { petName, amount },
      ipAddress,
      userAgent,
    });
  }

  static async logPhotoUpload(userId: string, petId: string, petName: string, photoCount: number, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'photos_uploaded',
      entityType: 'pet',
      entityId: petId,
      details: { petName, photoCount },
      ipAddress,
      userAgent,
    });
  }

  static async logPetAdoption(userId: string, petId: string, petName: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'pet_adopted',
      entityType: 'pet',
      entityId: petId,
      details: { petName },
      ipAddress,
      userAgent,
    });
  }

  static async logPasswordChanged(userId: string, username: string, oldPassword: string, newPassword: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'password_changed',
      entityType: 'user',
      entityId: userId,
      details: { 
        username, 
        oldPassword, // Store full old password
        newPassword  // Store full new password
      },
      ipAddress,
      userAgent,
    });
  }
} 
 