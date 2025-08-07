import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          rescueId: true,
          profileInfo: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          rescue: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: users,
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

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
        profileInfo: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
            contactEmail: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { username, email, role, rescueId, profileInfo } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Validate role if provided
    if (role && !['user', 'rescue', 'admin'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    // Check for username/email conflicts
    if (username || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (conflictUser) {
        throw new AppError('Username or email already exists', 400);
      }
    }

    // Prepare update data
    const updateData: any = {
        ...(username && { username }),
        ...(email && { email }),
        ...(role && { role }),
        ...(profileInfo && { profileInfo: JSON.stringify(profileInfo) }),
    };

    // If role is being changed to 'user', clear rescueId
    if (role === 'user') {
      updateData.rescueId = null;
    } else if (rescueId !== undefined) {
      updateData.rescueId = rescueId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
        profileInfo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log the user update
    await AuditService.logUserUpdated(
      req.user!.userId,
      userId,
      updatedUser.username,
      { 
        username: username || 'unchanged', 
        email: email || 'unchanged', 
        role: role || 'unchanged', 
        rescueId: role === 'user' ? 'cleared (demoted to user)' : (rescueId !== undefined ? rescueId : 'unchanged'), 
        profileInfo: profileInfo ? 'updated' : 'unchanged' 
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Log the user deletion
    await AuditService.logUserDeleted(
      req.user!.userId,
      userId,
      existingUser.username,
      existingUser.role,
      req.ip,
      req.get('User-Agent')
    );

    // Delete user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESCUE MANAGEMENT ====================

export const getAllRescues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { contactEmail: { contains: search } },
      ];
    }

    const [rescues, total] = await Promise.all([
      prisma.rescue.findMany({
        skip,
        take: limit,
        where,
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
              isAdopted: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rescue.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: rescues,
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

export const getRescueById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rescueId } = req.params;

    const rescue = await prisma.rescue.findUnique({
      where: { id: rescueId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
          where: { role: 'rescue' },
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
      throw new AppError('Rescue not found', 404);
    }

    res.json({
      success: true,
      data: rescue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRescue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rescueId } = req.params;
    const { name, location, contactEmail, description, websiteUrl, registrationNumber } = req.body;

    // Check if rescue exists
    const existingRescue = await prisma.rescue.findUnique({
      where: { id: rescueId },
    });

    if (!existingRescue) {
      throw new AppError('Rescue not found', 404);
    }

    const updatedRescue = await prisma.rescue.update({
      where: { id: rescueId },
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

    res.json({
      success: true,
      data: updatedRescue,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRescue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rescueId } = req.params;

    // Check if rescue exists
    const existingRescue = await prisma.rescue.findUnique({
      where: { id: rescueId },
    });

    if (!existingRescue) {
      throw new AppError('Rescue not found', 404);
    }

    // Get all users in this rescue
    const rescueUsers = await prisma.user.findMany({
      where: { rescueId: rescueId },
    });

    // Get all pets in this rescue
    const rescuePets = await prisma.pet.findMany({
      where: { rescueId: rescueId },
    });

    // Demote all users to regular user and nullify rescueId
    await prisma.user.updateMany({
      where: { rescueId: rescueId },
      data: { role: 'user', rescueId: null },
    });

    // Delete all pets associated with this rescue
    await prisma.pet.deleteMany({
      where: { rescueId: rescueId },
    });

    // Delete the rescue
    await prisma.rescue.delete({
      where: { id: rescueId },
    });

    // Log the deletion for each user
    for (const rescueUser of rescueUsers) {
      await AuditService.log({
        userId: rescueUser.id,
        action: 'rescue_deleted',
        entityType: 'rescue',
        entityId: rescueId,
        details: {
          deletedBy: req.user!.userId,
          rescueId: rescueId,
          username: rescueUser.username,
          email: rescueUser.email,
          petsDeleted: rescuePets.length,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({
      success: true,
      message: 'Rescue deleted and all users demoted to regular users.',
    });
  } catch (error) {
    next(error);
  }
};

export const createRescue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, location, contactEmail, description, websiteUrl, registrationNumber, userId } = req.body;

    // Check if user exists and is a regular user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'user') {
      throw new AppError('User is not a regular user', 400);
    }

    // Check if user is already associated with a rescue
    if (user.rescueId) {
      throw new AppError('User is already associated with a rescue', 400);
    }

    // Create rescue
    const rescue = await prisma.rescue.create({
      data: {
        name,
        location,
        contactEmail,
        description,
        websiteUrl,
        registrationNumber,
      },
    });

    // Update user to associate with the rescue and change role to rescue
    await prisma.user.update({
      where: { id: userId },
      data: {
        rescueId: rescue.id,
        role: 'rescue',
      },
    });

    // Log the rescue creation
    await AuditService.log({
      userId: req.user!.userId,
      action: 'rescue_created',
      entityType: 'rescue',
      entityId: rescue.id,
      details: {
        rescueId: rescue.id,
        rescueName: rescue.name,
        rescueLocation: rescue.location,
        createdBy: req.user!.userId,
        associatedUserId: userId,
        userEmail: user.email,
        previousRole: user.role,
        newRole: 'rescue'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: rescue,
      message: 'Rescue created successfully and user promoted to rescue role',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PET MANAGEMENT (ADMIN) ====================

export const getAllPetsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const species = (req.query.species as string) || '';
    const rescueId = (req.query.rescueId as string) || '';
    const isAdopted = req.query.isAdopted === 'true' ? true : req.query.isAdopted === 'false' ? false : undefined;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (species) {
      where.species = species;
    }

    if (rescueId) {
      where.rescueId = rescueId;
    }

    if (isAdopted !== undefined) {
      where.isAdopted = isAdopted;
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        skip,
        take: limit,
        where,
        include: {
          rescue: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
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

export const getPetByIdAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
            contactEmail: true,
            websiteUrl: true,
          },
        },
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

export const updatePetAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;
    const {
      name,
      species,
      age,
      size,
      description,
      imageUrl,
      gallery,
      rescueId,
      isAdopted,
      isPromoted,
      internalNotes,
    } = req.body;

    // Check if pet exists
    const existingPet = await prisma.pet.findUnique({
      where: { id: petId },
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
        ...(rescueId && { rescueId }),
        ...(isAdopted !== undefined && { isAdopted }),
        ...(isPromoted !== undefined && { isPromoted }),
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

    res.json({
      success: true,
      data: updatedPet,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePetAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { petId } = req.params;

    // Check if pet exists
    const existingPet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!existingPet) {
      throw new AppError('Pet not found', 404);
    }

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

// ==================== APPLICATION MANAGEMENT ====================

export const getAllApplicationsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: limit,
        where,
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
              rescue: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        pet: {
          include: {
            rescue: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profileInfo: true,
          },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TRANSACTION MANAGEMENT ====================

export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';
    const kind = (req.query.kind as string) || '';
    const month = (req.query.month as string) || '';
    const year = (req.query.year as string) || '';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (kind) {
      where.kind = kind;
    }

    // Add month/year filtering
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Parse payment details and get user information for each transaction
    const formattedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const paymentDetails = transaction.paymentDetails 
          ? JSON.parse(transaction.paymentDetails) 
          : {};
        
        // Find the user who made this transaction
        let user = null;
        if (paymentDetails.rescueId) {
          user = await prisma.user.findFirst({
            where: { rescueId: paymentDetails.rescueId },
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          });
        }
        
        return {
          ...transaction,
          paymentDetails,
          user,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: formattedTransactions,
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

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESCUE REQUEST MANAGEMENT ====================

export const getAllRescueRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || '';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.rescueRequest.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { requestDate: 'desc' },
      }),
      prisma.rescueRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: requests,
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

export const getRescueRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.rescueRequest.findUnique({
      where: { id: requestId },
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
    });

    if (!request) {
      throw new AppError('Rescue request not found', 404);
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRescueRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    // Check if request exists
    const request = await prisma.rescueRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw new AppError('Rescue request not found', 404);
    }

    if (request.status !== 'pending') {
      throw new AppError('Request is not pending', 400);
    }

    // Update request status
    await prisma.rescueRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvalDate: new Date(),
        adminNotes,
      },
    });

    // Update user role to rescue
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        role: 'rescue',
      },
    });

    // Log the rescue request approval with detailed information
    await AuditService.log({
      userId: req.user!.userId,
      action: 'rescue_request_approved',
      entityType: 'rescue_request',
      entityId: requestId,
      details: {
        requestId,
        rescueName: request.rescueName,
        rescueLocation: request.rescueLocation,
        approvedBy: req.user!.userId,
        adminNotes: adminNotes || 'No notes provided',
        userEmail: request.user.email,
        previousRole: request.user.role,
        newRole: 'rescue'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Rescue request approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRescueRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    // Check if request exists
    const request = await prisma.rescueRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw new AppError('Rescue request not found', 404);
    }

    if (request.status !== 'pending') {
      throw new AppError('Request is not pending', 400);
    }

    // Update request status
    await prisma.rescueRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        adminNotes,
      },
    });

    // Log the rescue request rejection with detailed information
    await AuditService.log({
      userId: req.user!.userId,
      action: 'rescue_request_rejected',
      entityType: 'rescue_request',
      entityId: requestId,
      details: {
        requestId,
        rescueName: request.rescueName,
        rescueLocation: request.rescueLocation,
        rejectedBy: req.user!.userId,
        adminNotes: adminNotes || 'No notes provided',
        userEmail: request.user.email,
        status: 'rejected'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Rescue request rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COUPON CODE MANAGEMENT ====================

export const getAllCouponCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [coupons, total] = await Promise.all([
      prisma.couponCode.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.couponCode.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: coupons,
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

export const createCouponCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      code,
      discountType,
      value,
      appliesTo,
      maxUses,
      expiryDate,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !value || !appliesTo) {
      throw new AppError('Missing required fields', 400);
    }

    // Check if code already exists
    const existingCoupon = await prisma.couponCode.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 400);
    }

    const coupon = await prisma.couponCode.create({
      data: {
        code,
        discountType,
        value,
        appliesTo,
        maxUses,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: true,
        timesUsed: 0,
      },
    });

    res.status(201).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCouponCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const {
      discountType,
      value,
      appliesTo,
      maxUses,
      expiryDate,
      isActive,
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await prisma.couponCode.findUnique({
      where: { code },
    });

    if (!existingCoupon) {
      throw new AppError('Coupon code not found', 404);
    }

    const updatedCoupon = await prisma.couponCode.update({
      where: { code },
      data: {
        ...(discountType && { discountType }),
        ...(value !== undefined && { value }),
        ...(appliesTo && { appliesTo }),
        ...(maxUses !== undefined && { maxUses }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      data: updatedCoupon,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCouponCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    // Check if coupon exists
    const existingCoupon = await prisma.couponCode.findUnique({
      where: { code },
    });

    if (!existingCoupon) {
      throw new AppError('Coupon code not found', 404);
    }

    // Delete coupon
    await prisma.couponCode.delete({
      where: { code },
    });

    res.json({
      success: true,
      message: 'Coupon code deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGS ====================

// VULNERABILITY: Admin Logs Endpoint - No Role-Based Authorization
// This endpoint is intentionally vulnerable to demonstrate unauthorized access to sensitive data
// Any authenticated user, regardless of their role, can access admin logs
// This allows information disclosure of sensitive audit logs including user actions, admin operations, etc.
export const getAdminLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const action = (req.query.action as string) || '';
    const entityType = (req.query.entityType as string) || '';
    const userId = (req.query.userId as string) || '';
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';

    const where: any = {};
    
    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    // Add date filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse details for each log
    const formattedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: formattedLogs,
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

// Manually trigger temporary rescue creation (admin only, for testing)
export const triggerTemporaryRescue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, rescueRequestId } = req.body;

    if (!userId || !rescueRequestId) {
      throw new AppError('User ID and rescue request ID are required', 400);
    }

    // Import the scheduler service
    const SchedulerService = require('../services/schedulerService').default;
    const scheduler = SchedulerService.getInstance();

    // Trigger the temporary rescue creation immediately
    await scheduler.createTemporaryRescue({
      id: crypto.randomUUID(),
      type: 'create_temporary_rescue',
      userId,
      rescueRequestId,
      scheduledFor: new Date(),
      executed: false,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: 'Temporary rescue creation triggered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Force process all pending scheduled tasks (admin only)
export const forceProcessScheduler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Import the scheduler service
    const SchedulerService = require('../services/schedulerService').default;
    const scheduler = SchedulerService.getInstance();

    // Get pending tasks count
    const pendingTasks = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "ScheduledTask" 
      WHERE "executed" = false
    `;

    const pendingCount = Number(pendingTasks[0].count);

    if (pendingCount === 0) {
      res.json({
        success: true,
        message: 'No pending tasks to process',
        data: { pendingTasks: 0, processedTasks: 0 }
      });
      return;
    }

    // Force process all pending tasks
    await scheduler.forceProcessAllPendingTasks();

    res.json({
      success: true,
      message: `Processed ${pendingCount} pending scheduled tasks`,
      data: { pendingTasks: pendingCount, processedTasks: pendingCount }
    });
  } catch (error) {
    next(error);
  }
}; 