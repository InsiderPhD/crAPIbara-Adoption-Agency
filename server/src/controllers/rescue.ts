import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const createRescue = async (req: Request, res: Response) => {
  try {
    const { name, location, contactEmail, description, websiteUrl, logoUrl, registrationNumber } = req.body;

    const rescue = await prisma.rescue.create({
      data: {
        name,
        location,
        contactEmail,
        description,
        websiteUrl,
        logoUrl,
        registrationNumber,
      },
    });

    res.status(201).json(rescue);
  } catch (error) {
    console.error('Error creating rescue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRescue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const rescue = await prisma.rescue.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
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
      throw new AppError('Rescue not found', 404);
    }

    res.json({
      success: true,
      data: rescue,
    });
  } catch (error) {
    console.error('Error fetching rescue:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
    res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateRescue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, contactEmail, description, websiteUrl, logoUrl, registrationNumber } = req.body;

    const rescue = await prisma.rescue.findUnique({
      where: { id },
    });

    if (!rescue) {
      throw new AppError('Rescue not found', 404);
    }

    const updatedRescue = await prisma.rescue.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(contactEmail && { contactEmail }),
        ...(description && { description }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(registrationNumber !== undefined && { registrationNumber }),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
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

    res.json({
      success: true,
      data: updatedRescue,
    });
  } catch (error) {
    console.error('Error updating rescue:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
    res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteRescue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rescue = await prisma.rescue.findUnique({
      where: { id },
    });

    if (!rescue) {
      return res.status(404).json({ message: 'Rescue not found' });
    }

    await prisma.rescue.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting rescue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listRescues = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [rescues, total] = await Promise.all([
      prisma.rescue.findMany({
        skip,
        take: parseInt(limit as string),
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          pets: {
            select: {
              id: true,
              name: true,
              species: true,
              isAdopted: true,
              isPromoted: true,
            },
          },
        },
      }),
      prisma.rescue.count(),
    ]);

    res.json({
      data: rescues,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching rescues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsersForRescue = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'user', // Only get regular users who can be added to rescues
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users for rescue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

export const addUserToRescue = async (req: Request, res: Response) => {
  try {
    const { rescueId, userId } = req.params;

    // Check if rescue exists
    const rescue = await prisma.rescue.findUnique({
      where: { id: rescueId },
    });

    if (!rescue) {
      throw new AppError('Rescue not found', 404);
    }

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

    // Check if user is already in a rescue
    if (user.rescueId) {
      throw new AppError('User is already associated with a rescue', 400);
    }

    // Add user to rescue
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        rescueId,
        role: 'rescue',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User successfully added to rescue',
    });
  } catch (error) {
    console.error('Error adding user to rescue:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

 