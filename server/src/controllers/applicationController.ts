import { Request, Response, NextFunction } from 'express';
import { ApplicationModel, ApplicationFormData } from '../models/Application';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { JwtPayload } from 'jsonwebtoken';
import { AuthRequest } from '../types/auth';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

// Define the schema for form data validation
const applicationFormDataSchema = z.object({
  applicantName: z.string(),
  adoptionAddress: z.object({
    street: z.string(),
    city: z.string(),
    postcode: z.string()
  }),
  housingStatus: z.enum(['homeowner', 'renter_with_permission', 'renter_without_permission']),
  hasSecureOutdoorSpace: z.boolean(),
  numberOfAdults: z.number(),
  numberOfChildren: z.number(),
  childrenAges: z.string(),
  hasOtherPets: z.boolean(),
  otherPetsDetails: z.string(),
  workHolidayPlans: z.string(),
  animalExperience: z.string(),
  idealAnimalPersonality: z.string(),
  referenceName: z.string(),
  referencePhone: z.string(),
  referenceEmail: z.string(),
  consent: z.boolean(),
  additionalDetails: z.string().optional()
});

type ProfileInfo = {
  firstName: string;
  lastName: string;
  [key: string]: any;
};

interface CustomJwtPayload extends JwtPayload {
  id: string;
  userId: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: CustomJwtPayload;
}

// Create a new application
export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { petId, formData } = req.body;
    
    // Validate form data
    const validatedFormData = applicationFormDataSchema.parse(formData);
    
    // VULNERABILITY: Store additionalDetails without sanitization
    // This allows stored XSS attacks through the additionalDetails field
    // Security testers can inject malicious scripts like: <script>alert('XSS');</script>
    const application = await ApplicationModel.create({
      userId: req.user!.userId,
      petId,
      status: 'pending',
      formData: JSON.stringify(validatedFormData)
    });

    // Get pet details for logging
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { name: true }
    });

    // Log application submission
    await AuditService.logApplicationSubmitted(
      req.user!.userId, 
      application.id.toString(), 
      petId, 
      pet?.name || 'Unknown Pet',
      req.ip, 
      req.get('User-Agent')
    );

    res.status(201).json({
      status: 'success',
      data: application
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid form data',
        details: error.errors
      });
    } else {
      console.error('Error creating application:', error);
      next(error);
    }
  }
};

// Get all applications for the current user
export const getUserApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await ApplicationModel.findByUserId(req.user!.userId);
    res.json({
      status: 'success',
      data: applications
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    next(error);
  }
};

// Get all applications for a specific pet (rescue users and admins only)
// VULNERABILITY: This endpoint only validates user role but does not check if the pet belongs to the user's rescue
// This allows rescue users to view applications for pets belonging to other rescues by changing the petId in the URL
export const getPetApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    // VULNERABILITY: Only check if user has rescue role or is admin
    // Do NOT verify that the petId actually belongs to this user's rescue
    if (!user?.rescueId && user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only rescue users and admins can view pet applications'
      });
    }

    // VULNERABILITY: Return applications for any petId without ownership verification
    // A rescue user can change the petId in the URL to access applications for pets belonging to other rescues
    const applications = await ApplicationModel.findByPetId(req.params.petId);
    res.json({
      status: 'success',
      data: applications
    });
  } catch (error) {
    console.error('Error fetching pet applications:', error);
    next(error);
  }
};

// Get all applications (admin and rescue users only)
export const getAllApplications = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let applications;
    if (user.role === 'admin') {
      // Admin can see all applications
      applications = await prisma.application.findMany({
        include: {
          pet: {
            include: {
              rescue: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              profileInfo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (user.role === 'rescue') {
      // Rescue users can only see applications for their pets
      applications = await prisma.application.findMany({
        where: {
          pet: {
            rescueId: user.rescueId || '',
          },
        },
        include: {
          pet: {
            include: {
              rescue: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              profileInfo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Regular users: only their own applications
      applications = await prisma.application.findMany({
        where: { userId: user.userId },
        include: {
          pet: {
            include: {
              rescue: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              profileInfo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => {
      let profileInfo: ProfileInfo = { firstName: '', lastName: '' };
      try {
        if (typeof app.user.profileInfo === 'string') {
          const parsed = JSON.parse(app.user.profileInfo);
          if (parsed && typeof parsed === 'object') {
            profileInfo = { 
              firstName: parsed.firstName || '',
              lastName: parsed.lastName || '',
              ...parsed
            };
          }
        } else if (app.user.profileInfo && typeof app.user.profileInfo === 'object') {
          const parsed = app.user.profileInfo as Record<string, any>;
          profileInfo = { 
            firstName: parsed.firstName || '',
            lastName: parsed.lastName || '',
            ...parsed
          };
        }
      } catch (error) {
        console.error('Error parsing profile info:', error);
      }
      
      return {
        ...app,
        user: {
          email: app.user.email,
          firstName: profileInfo.firstName || '',
          lastName: profileInfo.lastName || '',
        },
      };
    });

    res.json({ data: transformedApplications });
  } catch (error) {
    console.error('Error getting applications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Delete application (admin only)
export const deleteApplication = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete applications' });
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete the application
    await prisma.application.delete({
      where: { id },
    });

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Update application status (rescue users and admins only)
export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'unsuccessful'] as const;
    type ApplicationStatus = typeof validStatuses[number];

    if (!validStatuses.includes(status as ApplicationStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get the application with pet information
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        pet: {
          include: {
            rescue: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to update this application
    if (user.role !== 'admin' && application.pet.rescueId !== user.rescueId) {
      return res.status(403).json({ message: 'You do not have permission to update this application' });
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        pet: {
          include: {
            rescue: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            profileInfo: true,
          },
        },
      },
    });

    // Transform the response to match the expected format
    let profileInfo: ProfileInfo = { firstName: '', lastName: '' };
    
    if (updatedApplication.user.profileInfo && typeof updatedApplication.user.profileInfo === 'object') {
      try {
        const parsed = updatedApplication.user.profileInfo as Record<string, any>;
        profileInfo = { 
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          ...parsed
        };
      } catch (error) {
        console.error('Error parsing profile info:', error);
        profileInfo = { firstName: '', lastName: '' };
      }
    }

    const transformedApplication = {
      ...updatedApplication,
      user: {
        email: updatedApplication.user.email,
        firstName: profileInfo.firstName,
        lastName: profileInfo.lastName,
      },
    };

    res.json({ data: transformedApplication });
  } catch (error) {
    console.error('Error updating application status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { additionalDetails } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    // Find the application and verify ownership
    const application = await prisma.application.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }

    if (application.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this application'
      });
    }

    // Update the application with additional details
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        formData: {
          ...application.formData as any,
          additionalDetails: additionalDetails || null
        },
        updatedAt: new Date()
      }
    });

    res.json({
      status: 'success',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      status: 'error',
      message: 'Failed to update application',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 