import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types/auth';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

// Get all pets (public view - excludes internal notes)
export const getAllPets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || 'dateListed';
    const order = (req.query.order as string) || 'desc';
    const species = (req.query.species as string)?.split(',') || [];
    const size = (req.query.size as string)?.split(',') || [];
    const minAge = parseInt(req.query.minAge as string) || 0;
    const maxAge = parseInt(req.query.maxAge as string) || 20;
    const search = (req.query.search as string) || '';
    const rescueId = (req.query.rescueId as string) || '';
    const showAdopted = req.query.showAdopted === 'true';

    // Build where clause
    const where: any = {
      isAdopted: showAdopted ? undefined : false, // Only show non-adopted pets by default unless showAdopted is true
    };

    if (species.length > 0) {
      where.species = { in: species };
    }

    if (size.length > 0) {
      where.size = { in: size };
    }

    if (minAge > 0 || maxAge < 20) {
      where.age = {
        ...(minAge > 0 && { gte: minAge }),
        ...(maxAge < 20 && { lte: maxAge }),
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (rescueId) {
      where.rescueId = rescueId;
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        skip,
        take: limit,
        where,
        orderBy: [
          { isPromoted: 'desc' }, // Promoted pets first
          { [sort]: order }, // Then by the specified sort
        ],
        select: {
          id: true,
          referenceNumber: true,
          name: true,
          species: true,
          age: true,
          size: true,
          description: true,
          imageUrl: true,
          gallery: true,
          rescueId: true,
          isAdopted: true,
          isPromoted: true,
          dateListed: true,
          createdAt: true,
          updatedAt: true,
          rescue: {
            select: {
              id: true,
              name: true,
              location: true,
              contactEmail: true,
              websiteUrl: true,
            },
          },
        },
      }),
      prisma.pet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
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
    console.error('Error getting all pets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to fetch pets',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Get a single pet by ID (public view)
export const getPetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pet = await prisma.pet.findUnique({
      where: { id },
      select: {
        id: true,
        referenceNumber: true,
        name: true,
        species: true,
        age: true,
        size: true,
        description: true,
        imageUrl: true,
        gallery: true,
        rescueId: true,
        isAdopted: true,
        isPromoted: true,
        dateListed: true,
        createdAt: true,
        updatedAt: true,
        internalNotes: true,
        rescue: {
          select: {
            id: true,
            name: true,
            location: true,
            contactEmail: true,
            websiteUrl: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!pet) {
      throw new AppError('Pet not found', 404);
    }

    res.json({ data: pet });
  } catch (error) {
    next(error);
  }
};

// Create a new pet
export const createPet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Authorization checks
    if (user.role === 'rescue') {
      // Rescue users can only create pets for their own rescue
      if (req.body.rescueId !== user.rescueId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create pets for your own rescue'
        });
      }
    }

    const {
      name,
      species,
      age,
      size,
      description,
      imageUrl,
      gallery,
      rescueId,
      internalNotes,
    } = req.body;

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
        rescueId,
        internalNotes,
      },
      select: {
        id: true,
        referenceNumber: true,
        name: true,
        species: true,
        age: true,
        size: true,
        description: true,
        imageUrl: true,
        gallery: true,
        rescueId: true,
        isAdopted: true,
        isPromoted: true,
        dateListed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log pet creation
    await AuditService.logPetCreated(user.userId, pet.id, pet.name, req.ip, req.get('User-Agent'));

    res.status(201).json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};

// Update a pet
export const updatePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if pet exists and get current data
    const existingPet = await prisma.pet.findUnique({
      where: { id },
      select: {
        rescueId: true,
        isPromoted: true
      }
    });

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Authorization checks
    if (user.role === 'rescue') {
      // Rescue users can only update their own pets
      if (existingPet.rescueId !== user.rescueId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update pets from your rescue'
        });
      }
      
      // Rescue users cannot modify promotion status
      if (req.body.isPromoted !== undefined && req.body.isPromoted !== existingPet.isPromoted) {
        return res.status(403).json({
          success: false,
          message: 'Rescue users cannot modify promotion status'
        });
      }
    }

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

    const pet = await prisma.pet.update({
      where: { id },
      data: {
        name,
        species,
        age,
        size,
        description,
        imageUrl,
        gallery: gallery ? JSON.stringify(gallery) : undefined,
        rescueId,
        isAdopted,
        isPromoted,
        internalNotes,
      },
      select: {
        id: true,
        referenceNumber: true,
        name: true,
        species: true,
        age: true,
        size: true,
        description: true,
        imageUrl: true,
        gallery: true,
        rescueId: true,
        isAdopted: true,
        isPromoted: true,
        dateListed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log pet update
    await AuditService.logPetUpdated(user.userId, pet.id, pet.name, req.body, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    next(error);
  }
};

// Delete a pet
export const deletePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if pet exists and get current data
    const existingPet = await prisma.pet.findUnique({
      where: { id },
      select: {
        rescueId: true
      }
    });

    if (!existingPet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Get pet name before deletion for logging
    const petToDelete = await prisma.pet.findUnique({
      where: { id },
      select: { name: true }
    });

    await prisma.pet.delete({
      where: { id },
    });

    // Log pet deletion
    if (petToDelete) {
      await AuditService.logPetDeleted(user.userId, id, petToDelete.name, req.ip, req.get('User-Agent'));
    }

    res.status(204).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 