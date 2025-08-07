import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ApplicationFormData {
  applicantName: string;
  adoptionAddress: {
    street: string;
    city: string;
    postcode: string;
  };
  housingStatus: 'homeowner' | 'renter_with_permission' | 'renter_without_permission';
  hasSecureOutdoorSpace: boolean;
  numberOfAdults: number;
  numberOfChildren: number;
  childrenAges: string;
  hasOtherPets: boolean;
  otherPetsDetails: string;
  workHolidayPlans: string;
  animalExperience: string;
  idealAnimalPersonality: string;
  referenceName: string;
  referencePhone: string;
  referenceEmail: string;
  consent: boolean;
}

export interface Application {
  id: string;
  userId: string;
  petId: string;
  status: string;
  formData: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ApplicationModel {
  static async create(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
    const application = await prisma.application.create({
      data: {
        userId: data.userId,
        petId: data.petId,
        status: data.status,
        formData: data.formData
      }
    });
    return application;
  }

  static async findById(id: string): Promise<Application | null> {
    return prisma.application.findUnique({
      where: { id }
    });
  }

  static async findByUserId(userId: string): Promise<Application[]> {
    return prisma.application.findMany({
      where: { userId }
    });
  }

  static async findByPetId(petId: string): Promise<Application[]> {
    return prisma.application.findMany({
      where: { petId }
    });
  }

  static async update(id: string, data: Partial<Application>): Promise<Application> {
    return prisma.application.update({
      where: { id },
      data: {
        ...data,
        formData: data.formData ? data.formData : undefined
      }
    });
  }

  static async delete(id: string): Promise<Application> {
    return prisma.application.delete({
      where: { id }
    });
  }
} 