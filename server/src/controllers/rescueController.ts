import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

// ==================== RESCUE PROFILE MANAGEMENT ====================

export const getRescueProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    const rescue = await prisma.rescue.findUnique({
      where: { id: user.rescueId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
        pets: {
          select: {
            id: true,
            name: true,
            species: true,
            age: true,
            isAdopted: true,
            isPromoted: true,
            dateListed: true,
          },
          orderBy: { dateListed: 'desc' },
        },
      },
    });

    if (!rescue) {
      throw new AppError('Rescue profile not found', 404);
    }

    res.json({
      success: true,
      data: rescue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRescueProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { name, location, contactEmail, description, websiteUrl, registrationNumber } = req.body;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    const updatedRescue = await prisma.rescue.update({
      where: { id: user.rescueId },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(contactEmail && { contactEmail }),
        ...(description && { description }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(registrationNumber !== undefined && { registrationNumber }),
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log rescue profile update
    await AuditService.log({
      userId: user.userId,
      action: 'rescue_profile_updated',
      entityType: 'rescue',
      entityId: user.rescueId,
      details: { rescueName: updatedRescue.name, changes: req.body },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: updatedRescue,
    });
  } catch (error) {
    next(error);
  }
};

// Upload rescue logo
export const uploadRescueLogo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = req.file.originalname;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}-${originalName}`;

    // Save file to uploads directory
    const uploadPath = `uploads/${filename}`;
    const fs = require('fs');
    const path = require('path');
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to uploads directory
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Update rescue with new logo URL
    const logoUrl = `http://localhost:3000/uploads/${filename}`;
    
    const updatedRescue = await prisma.rescue.update({
      where: { id: user.rescueId },
      data: { logoUrl },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedRescue,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PET MANAGEMENT FOR RESCUE ====================

export const getRescuePets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const isAdopted = req.query.isAdopted === 'true' ? true : req.query.isAdopted === 'false' ? false : undefined;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    const where: any = {
      rescueId: user.rescueId,
    };

    if (isAdopted !== undefined) {
      where.isAdopted = isAdopted;
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        skip,
        take: limit,
        where,
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { isPromoted: 'desc' },
          { dateListed: 'desc' },
        ],
      }),
      prisma.pet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: pets,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRescuePetById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId,
      },
      include: {
        applications: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profileInfo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    res.json({
      success: true,
      data: pet,
    });
  } catch (error) {
    next(error);
  }
};

export const createRescuePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const {
      name,
      species,
      age,
      size,
      description,
      imageUrl,
      gallery,
      internalNotes,
    } = req.body;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Generate reference number
    const referenceNumber = `SPEC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const pet = await prisma.pet.create({
      data: {
        referenceNumber,
        name,
        species,
        age,
        size,
        description,
        imageUrl,
        gallery: JSON.stringify(gallery || []),
        rescueId: user.rescueId,
        internalNotes,
      },
      include: {
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log rescue pet creation
    await AuditService.logPetCreated(user.userId, pet.id, pet.name, req.ip, req.get('User-Agent'));

    res.status(201).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRescuePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    const {
      name,
      species,
      age,
      size,
      description,
      imageUrl,
      gallery,
      isAdopted,
      internalNotes,
    } = req.body;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Check if pet exists and belongs to this rescue
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId,
      },
    });

    if (!existingPet) {
      throw new AppError('Pet not found', 404);
    }

    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: {
        ...(name && { name }),
        ...(species && { species }),
        ...(age !== undefined && { age }),
        ...(size && { size }),
        ...(description && { description }),
        ...(imageUrl && { imageUrl }),
        ...(gallery && { gallery: JSON.stringify(gallery) }),
        ...(isAdopted !== undefined && { isAdopted }),
        ...(internalNotes !== undefined && { internalNotes }),
      },
      include: {
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log rescue pet update
    await AuditService.logPetUpdated(user.userId, petId, updatedPet.name, req.body, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      data: updatedPet,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRescuePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Check if pet exists and belongs to this rescue
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId,
      },
    });

    if (!existingPet) {
      throw new AppError('Pet not found', 404);
    }

    // Log rescue pet deletion
    await AuditService.logPetDeleted(user.userId, petId, existingPet.name, req.ip, req.get('User-Agent'));

    // Delete pet (this will cascade to related records)
    await prisma.pet.delete({
      where: { id: petId },
    });

    res.json({
      success: true,
      message: 'Pet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== APPLICATION MANAGEMENT FOR RESCUE ====================

export const getPetApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Verify pet belongs to this rescue
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId,
      },
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    const where: any = {
      petId,
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              profileInfo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { applicationId } = req.params;
    const { status } = req.body;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Check if application exists and belongs to this rescue's pet
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        pet: {
          rescueId: user.rescueId,
        },
      },
      include: {
        pet: true,
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If application is approved, mark pet as adopted
    if (status === 'approved') {
      await prisma.pet.update({
        where: { id: application.petId },
        data: { isAdopted: true },
      });
    }

    // Log application status update
    if (status === 'approved') {
      await AuditService.logApplicationApproved(
        application.userId, 
        applicationId.toString(), 
        application.petId, 
        application.pet.name, 
        user.userId, 
        req.ip, 
        req.get('User-Agent')
      );
    } else if (status === 'rejected') {
      await AuditService.logApplicationRejected(
        application.userId, 
        applicationId.toString(), 
        application.petId, 
        application.pet.name, 
        user.userId, 
        req.ip, 
        req.get('User-Agent')
      );
    }

    res.json({
      success: true,
      data: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PROMOTION MANAGEMENT ====================

export const promotePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Check if pet exists and belongs to this rescue
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId,
      },
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    if (pet.isAdopted) {
      throw new AppError('Cannot promote an adopted pet', 400);
    }

    // For now, we'll just toggle the promotion status
    // In a real implementation, this would involve payment processing
    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: { isPromoted: !pet.isPromoted },
      include: {
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPet,
      message: updatedPet.isPromoted ? 'Pet promoted successfully' : 'Pet promotion removed',
    });
  } catch (error) {
    next(error);
  }
}; 
// Remove user from rescue
export const removeUserFromRescue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { userId } = req.params;
    
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Check if the user to be removed exists and belongs to this rescue
    const userToRemove = await prisma.user.findFirst({
      where: {
        id: userId,
        rescueId: user.rescueId,
      },
    });

    if (!userToRemove) {
      throw new AppError('User not found in this rescue', 404);
    }

    // Prevent removing the last user from the rescue
    const rescueUserCount = await prisma.user.count({
      where: { rescueId: user.rescueId },
    });

    if (rescueUserCount <= 1) {
      throw new AppError('Cannot remove the last user from the rescue', 400);
    }

    // Remove user from rescue (set rescueId to null and change role to 'user')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        rescueId: null,
        role: 'user',
      },
    });

    // Log the user removal
    const AuditService = require('../services/auditService').AuditService;
    await AuditService.log({
      userId: user.userId,
      action: 'user_removed_from_rescue',
      entityType: 'user',
      entityId: userId,
      details: {
        removedUserId: userId,
        removedUserEmail: userToRemove.email,
        rescueId: user.rescueId,
        previousRole: userToRemove.role,
        newRole: 'user',
        removedBy: user.userId,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'User removed from rescue successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}; 

// Rescue user deletes their own rescue
export const deleteRescueSelf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.rescueId) {
      throw new AppError('Rescue profile not found', 404);
    }

    // Get all users in this rescue
    const rescueUsers = await prisma.user.findMany({
      where: { rescueId: user.rescueId },
    });

    // Demote all users to regular user and nullify rescueId
    await prisma.user.updateMany({
      where: { rescueId: user.rescueId },
      data: { role: 'user', rescueId: null },
    });

    // Delete the rescue
    await prisma.rescue.delete({
      where: { id: user.rescueId },
    });

    // Log the deletion for each user
    const AuditService = require('../services/auditService').AuditService;
    for (const rescueUser of rescueUsers) {
      await AuditService.log({
        userId: rescueUser.id,
        action: 'rescue_deleted',
        entityType: 'rescue',
        entityId: user.rescueId,
        details: {
          deletedBy: user.userId,
          rescueId: user.rescueId,
          username: rescueUser.username,
          email: rescueUser.email,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({
      success: true,
      message: 'Rescue deleted and all users demoted to regular users.'
    });
  } catch (error) {
    next(error);
  }
}; 
