import { PrismaClient } from '@prisma/client';
import { AuditService } from './auditService';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface ScheduledTask {
  id: string;
  type: 'create_temporary_rescue';
  userId: string;
  rescueRequestId: string;
  scheduledFor: Date;
  executed: boolean;
  createdAt: Date;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.startScheduler();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  private startScheduler() {
    // Check for scheduled tasks every minute
    this.intervalId = setInterval(async () => {
      await this.processScheduledTasks();
    }, 60000); // 1 minute
  }

  public async processScheduledTasks() {
    try {
      const now = new Date();
      
      // Get all pending tasks that are due
      const pendingTasks = await prisma.$queryRaw<ScheduledTask[]>`
        SELECT * FROM "ScheduledTask" 
        WHERE "executed" = false 
        AND "scheduledFor" <= ${now}
        ORDER BY "scheduledFor" ASC
      `;

      for (const task of pendingTasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('Error processing scheduled tasks:', error);
    }
  }

  public async forceProcessAllPendingTasks() {
    try {
      // Get ALL pending tasks regardless of scheduled time
      const pendingTasks = await prisma.$queryRaw<ScheduledTask[]>`
        SELECT * FROM "ScheduledTask" 
        WHERE "executed" = false 
        ORDER BY "scheduledFor" ASC
      `;

      for (const task of pendingTasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('Error forcing processing of all pending tasks:', error);
    }
  }

  private async executeTask(task: ScheduledTask) {
    try {
      switch (task.type) {
        case 'create_temporary_rescue':
          await this.createTemporaryRescue(task);
          break;
        default:
          console.warn(`Unknown task type: ${task.type}`);
      }

      // Mark task as executed
      await prisma.$executeRaw`
        UPDATE "ScheduledTask" 
        SET "executed" = true 
        WHERE "id" = ${task.id}
      `;
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
    }
  }

  private async createTemporaryRescue(task: ScheduledTask) {
    try {
      // Get the rescue request
      const rescueRequest = await prisma.rescueRequest.findUnique({
        where: { id: task.rescueRequestId },
        include: { user: true }
      });

      if (!rescueRequest) {
        console.error(`Rescue request not found: ${task.rescueRequestId}`);
        return;
      }

      // Check if user is still a regular user (not already promoted)
      if (rescueRequest.user.role !== 'user') {
        console.log(`User ${rescueRequest.user.id} already promoted, skipping temporary rescue creation`);
        return;
      }

      // Create temporary rescue
      const rescue = await prisma.rescue.create({
        data: {
          name: `Temporary Rescue - ${rescueRequest.rescueName}`,
          location: rescueRequest.rescueLocation,
          contactEmail: rescueRequest.user.email,
          description: 'Temporary rescue account. Please update your details in the Manage Rescue page.',
          websiteUrl: '',
          registrationNumber: '',
        },
      });

      // Update user to associate with the rescue and change role to rescue
      await prisma.user.update({
        where: { id: task.userId },
        data: {
          rescueId: rescue.id,
          role: 'rescue',
        },
      });

      // Update rescue request status
      await prisma.rescueRequest.update({
        where: { id: task.rescueRequestId },
        data: {
          status: 'approved',
          approvalDate: new Date(),
          adminNotes: 'Automatically approved and temporary rescue created',
        },
      });

      // Log the automatic rescue creation
      await AuditService.log({
        userId: task.userId,
        action: 'temporary_rescue_created',
        entityType: 'rescue',
        entityId: rescue.id,
        details: {
          rescueId: rescue.id,
          rescueName: rescue.name,
          rescueLocation: rescue.location,
          rescueRequestId: task.rescueRequestId,
          originalRescueName: rescueRequest.rescueName,
          originalRescueLocation: rescueRequest.rescueLocation,
          userEmail: rescueRequest.user.email,
          previousRole: 'user',
          newRole: 'rescue',
          automatic: true
        },
        ipAddress: 'system',
        userAgent: 'scheduler'
      });

      console.log(`Temporary rescue created for user ${task.userId}`);
    } catch (error) {
      console.error('Error creating temporary rescue:', error);
      throw error;
    }
  }

  public async scheduleTemporaryRescue(userId: string, rescueRequestId: string, delayMinutes: number = 10) {
    try {
      const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
      
      await prisma.$executeRaw`
        INSERT INTO "ScheduledTask" ("id", "type", "userId", "rescueRequestId", "scheduledFor", "executed", "createdAt")
        VALUES (${randomUUID()}, 'create_temporary_rescue', ${userId}, ${rescueRequestId}, ${scheduledFor}, false, ${new Date()})
      `;

      console.log(`Scheduled temporary rescue creation for user ${userId} at ${scheduledFor}`);
    } catch (error) {
      console.error('Error scheduling temporary rescue creation:', error);
      throw error;
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default SchedulerService; 
 