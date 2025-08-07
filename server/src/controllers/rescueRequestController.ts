import { Request, Response } from 'express';
import { RescueRequestModel, rescueRequestSchema } from '../models/RescueRequest';
import SchedulerService from '../services/schedulerService';
import { AuditService } from '../services/auditService';

export const createRescueRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validatedData = rescueRequestSchema.parse(req.body);
    const request = await RescueRequestModel.create({
      userId,
      reason: validatedData.reason,
      rescueName: validatedData.rescueName,
      rescueLocation: validatedData.rescueLocation,
      couponCode: validatedData.couponCode || null,
    });

    // Log rescue request submission
    await AuditService.logRescueRequestSubmitted(
      userId, 
      request.id.toString(), 
      validatedData.rescueName, 
      req.ip, 
      req.get('User-Agent')
    );

    // Schedule automatic temporary rescue creation in 10 minutes
    const scheduler = SchedulerService.getInstance();
    await scheduler.scheduleTemporaryRescue(userId, request.id, 10);

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating rescue request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(400).json({ 
      message: 'Failed to create rescue request',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const getRescueRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RescueRequestModel.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }

    // Only allow access if user is admin or the request owner
    if (req.user?.role !== 'admin' && request.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching rescue request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to fetch rescue request',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const getUserRescueRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requests = await RescueRequestModel.findByUserId(userId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user rescue requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to fetch rescue requests',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const getAllRescueRequests = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const status = req.query.status as string | undefined;
    const requests = await RescueRequestModel.findAll(status);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching all rescue requests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to fetch rescue requests',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const updateRescueRequestStatus = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'payment_pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await RescueRequestModel.updateStatus(id, status, adminNotes);
    if (!request) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating rescue request status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to update rescue request status',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const updateRescueRequestPayment = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    const { amountPaid } = req.body;

    if (typeof amountPaid !== 'number' || amountPaid < 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const request = await RescueRequestModel.updatePayment(id, amountPaid);
    if (!request) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating rescue request payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to update rescue request payment',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const deleteRescueRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await RescueRequestModel.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Rescue request not found' });
    }

    // Only allow deletion if user is admin or the request owner
    if (req.user?.role !== 'admin' && request.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await RescueRequestModel.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rescue request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to delete rescue request',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 