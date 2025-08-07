import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

export const promotePet = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { petId } = req.params;
    const { cardNumber, expiryDate, cvv, cardholderName, couponCode } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is a rescue and owns this pet
    if (user.role !== 'rescue') {
      return res.status(403).json({ message: 'Only rescue users can promote pets' });
    }

    // Find the pet and verify ownership
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        rescueId: user.rescueId || '',
      },
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found or not owned by your rescue' });
    }

    if (pet.isAdopted) {
      return res.status(400).json({ message: 'Cannot promote an adopted pet' });
    }

    if (pet.isPromoted) {
      return res.status(400).json({ message: 'Pet is already promoted' });
    }

    // Calculate promotion fee and apply coupon if provided
    let promotionFee = 5.00; // $5 promotion fee
    let discountApplied = 0;
    let couponUsed = null;
    let isFreePromotion = false;

    if (couponCode) {
      // Validate coupon code
      const coupon = await prisma.couponCode.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: 'Coupon code is inactive' });
      }

      if (coupon.expiryDate && new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: 'Coupon code has expired' });
      }

      if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
        return res.status(400).json({ message: 'Coupon code usage limit exceeded' });
      }

      if (coupon.appliesTo !== 'promotion') {
        return res.status(400).json({ message: 'Coupon code is not valid for promotions' });
      }

      // Apply discount
      if (coupon.discountType === 'percentage') {
        discountApplied = (promotionFee * coupon.value) / 100;
      } else if (coupon.discountType === 'fixed_amount') {
        discountApplied = coupon.value;
      }

      // Ensure discount doesn't exceed the promotion fee
      discountApplied = Math.min(discountApplied, promotionFee);
      promotionFee = Math.max(0, promotionFee - discountApplied);
      isFreePromotion = promotionFee === 0;

      // Update coupon usage
      await prisma.couponCode.update({
        where: { code: couponCode },
        data: { timesUsed: coupon.timesUsed + 1 },
      });

      couponUsed = {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discountApplied,
      };
    }

    // Validate card details if promotion is not free
    if (promotionFee > 0) {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        return res.status(400).json({ 
          message: 'Card details are required for paid promotions' 
        });
      }
    }

    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        kind: promotionFee === 0 ? 'free_promotion' : 'sale',
        gateway: promotionFee === 0 ? 'free_promotion' : 'test_gateway',
        gatewayTransactionId: promotionFee === 0 
          ? `free_promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          : `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        amount: promotionFee,
        currency: 'USD',
        paymentDetails: JSON.stringify({
          cardholderName: promotionFee === 0 ? null : cardholderName,
          cardLast4: promotionFee === 0 ? null : (cardNumber ? cardNumber.slice(-4) : null),
          promotionType: 'pet_promotion',
          petId,
          petName: pet.name,
          rescueId: user.rescueId,
          originalFee: 5.00,
          discountApplied,
          couponUsed,
          isFreePromotion: promotionFee === 0,
        }),
      },
    });

    // Update the pet to be promoted
    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: { isPromoted: true },
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

    // Log pet promotion
    await AuditService.logPetPromotion(
      user.userId, 
      petId, 
      pet.name, 
      promotionFee, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: {
        pet: updatedPet,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt,
          originalFee: 5.00,
          discountApplied,
          couponUsed,
        },
      },
      message: couponUsed ? `Pet promoted successfully with ${couponUsed.code} coupon!` : 'Pet promoted successfully!',
    });
  } catch (error) {
    console.error('Error promoting pet:', error);
    res.status(500).json({ message: 'Failed to promote pet' });
  }
};

export const validateCouponCode = async (req: Request, res: Response) => {
  try {
    const { couponCode } = req.params;

    if (!couponCode) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    // Find the coupon code
    const coupon = await prisma.couponCode.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code is inactive' 
      });
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code has expired' 
      });
    }

    if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code usage limit exceeded' 
      });
    }

    if (coupon.appliesTo !== 'promotion') {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code is not valid for promotions' 
      });
    }

    // Calculate discount for promotion fee
    const promotionFee = 5.00;
    let discountApplied = 0;

    if (coupon.discountType === 'percentage') {
      discountApplied = (promotionFee * coupon.value) / 100;
    } else if (coupon.discountType === 'fixed_amount') {
      discountApplied = coupon.value;
    }

    // Ensure discount doesn't exceed the promotion fee
    discountApplied = Math.min(discountApplied, promotionFee);
    const finalFee = Math.max(0, promotionFee - discountApplied);

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        appliesTo: coupon.appliesTo,
        maxUses: coupon.maxUses,
        timesUsed: coupon.timesUsed,
        expiryDate: coupon.expiryDate,
      },
      discount: {
        originalFee: promotionFee,
        discountApplied,
        finalFee,
        discountPercentage: ((discountApplied / promotionFee) * 100).toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error validating coupon code:', error);
    res.status(500).json({ message: 'Failed to validate coupon code' });
  }
};

export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let transactions;

    // If user is admin, get all transactions
    if (user.role === 'admin') {
      transactions = await prisma.transaction.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Get transactions for this user's rescue
      transactions = await prisma.transaction.findMany({
        where: {
          paymentDetails: {
            contains: user.rescueId || '',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Parse payment details for each transaction
    const formattedTransactions = transactions.map((transaction: any) => {
      const paymentDetails = transaction.paymentDetails 
        ? JSON.parse(transaction.paymentDetails) 
        : {};
      
      return {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        kind: transaction.kind,
        createdAt: transaction.createdAt,
        paymentDetails,
        // For admin view, extract user info from payment details if available
        user: user.role === 'admin' ? {
          rescueId: paymentDetails.rescueId || null,
          petName: paymentDetails.petName || null,
          cardholderName: paymentDetails.cardholderName || null,
        } : null,
      };
    });

    res.json({
      success: true,
      data: formattedTransactions,
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
}; 