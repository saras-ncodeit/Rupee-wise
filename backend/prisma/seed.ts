import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedCategory {
  name: string;
  type: 'expense' | 'income' | 'transfer';
  icon: string;
  color: string;
  subcategories: string[];
}

const SYSTEM_CATEGORIES: SeedCategory[] = [
  // 💸 EXPENSE CATEGORIES
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: 'utensils',
    color: '#F97316', // Orange
    subcategories: ['Restaurants', 'Groceries', 'Coffee Shops', 'Food Delivery', 'Snacks & Beverages'],
  },
  {
    name: 'Housing & Utilities',
    type: 'expense',
    icon: 'home',
    color: '#3B82F6', // Blue
    subcategories: ['Rent/EMI', 'Electricity', 'Water', 'Gas', 'Internet', 'Mobile Recharge', 'Maintenance'],
  },
  {
    name: 'Transport',
    type: 'expense',
    icon: 'car',
    color: '#06B6D4', // Cyan
    subcategories: ['Fuel', 'Auto/Cab', 'Public Transport', 'Parking', 'Vehicle Maintenance', 'Toll'],
  },
  {
    name: 'Health & Medical',
    type: 'expense',
    icon: 'activity',
    color: '#EF4444', // Red
    subcategories: ['Doctor Visits', 'Medicines', 'Gym & Fitness', 'Health Insurance', 'Lab Tests'],
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#EC4899', // Pink
    subcategories: ['Clothing', 'Electronics', 'Home & Kitchen', 'Personal Care', 'Books & Stationery'],
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'film',
    color: '#8B5CF6', // Violet
    subcategories: ['Movies & Events', 'Streaming (OTT)', 'Games', 'Hobbies', 'Sports'],
  },
  {
    name: 'Education',
    type: 'expense',
    icon: 'book-open',
    color: '#10B981', // Emerald
    subcategories: ['School Fees', 'Tuition', 'Online Courses', 'Books'],
  },
  {
    name: 'Travel',
    type: 'expense',
    icon: 'plane',
    color: '#14B8A6', // Teal
    subcategories: ['Flights', 'Hotels', 'Local Transport (Travel)', 'Travel Insurance', 'Visa Fees'],
  },
  {
    name: 'Personal Care',
    type: 'expense',
    icon: 'smile',
    color: '#F43F5E', // Rose
    subcategories: ['Haircut', 'Salon & Spa', 'Skincare'],
  },
  {
    name: 'Gifts & Donations',
    type: 'expense',
    icon: 'gift',
    color: '#D946EF', // Fuchsia
    subcategories: ['Gifts', 'Charity', 'Religious Donations'],
  },
  {
    name: 'Finance Charges',
    type: 'expense',
    icon: 'credit-card',
    color: '#64748B', // Slate
    subcategories: ['Bank Fees', 'Credit Card Interest', 'Loan Processing Fees'],
  },
  {
    name: 'Insurance',
    type: 'expense',
    icon: 'shield',
    color: '#475569', // Dark Slate
    subcategories: ['Life Insurance', 'Health Insurance', 'Vehicle Insurance'],
  },
  {
    name: 'Kids & Family',
    type: 'expense',
    icon: 'heart',
    color: '#F472B6', // Light Pink
    subcategories: ['Baby Products', 'Toys', 'School Supplies', 'Kids Activities'],
  },
  {
    name: 'Pets',
    type: 'expense',
    icon: 'paw',
    color: '#F59E0B', // Amber
    subcategories: ['Pet Food', 'Vet Visits', 'Pet Grooming'],
  },
  {
    name: 'Miscellaneous',
    type: 'expense',
    icon: 'archive',
    color: '#94A3B8', // Grey
    subcategories: ['Uncategorized', 'Other'],
  },

  // 💰 INCOME CATEGORIES
  {
    name: 'Salary & Wages',
    type: 'income',
    icon: 'briefcase',
    color: '#10B981', // Emerald
    subcategories: ['Salary', 'Bonus', 'Commission', 'Overtime'],
  },
  {
    name: 'Freelance & Self-Employment',
    type: 'income',
    icon: 'laptop',
    color: '#06B6D4', // Cyan
    subcategories: ['Client Payments', 'Project Income', 'Consulting'],
  },
  {
    name: 'Investments',
    type: 'income',
    icon: 'trending-up',
    color: '#8B5CF6', // Violet
    subcategories: ['Dividends', 'Interest Income', 'Capital Gains', 'Mutual Fund Returns'],
  },
  {
    name: 'Rental Income',
    type: 'income',
    icon: 'building',
    color: '#3B82F6', // Blue
    subcategories: ['Property Rent', 'Subletting'],
  },
  {
    name: 'Business Income',
    type: 'income',
    icon: 'store',
    color: '#14B8A6', // Teal
    subcategories: ["Owner's Drawings", 'Business Profit'],
  },
  {
    name: 'Gifts & Transfers',
    type: 'income',
    icon: 'gift',
    color: '#EC4899', // Pink
    subcategories: ['Family Transfers', 'Gift Money'],
  },
  {
    name: 'Government & Subsidies',
    type: 'income',
    icon: 'landmark',
    color: '#64748B', // Slate
    subcategories: ['Tax Refund', 'Government Benefits'],
  },
  {
    name: 'Other Income',
    type: 'income',
    icon: 'award',
    color: '#F59E0B', // Amber
    subcategories: ['Cashback & Rewards', 'Side Hustle', 'Selling Items'],
  },
];

async function main() {
  console.log('Seeding system categories...');

  for (let sortOrder = 0; sortOrder < SYSTEM_CATEGORIES.length; sortOrder++) {
    const cat = SYSTEM_CATEGORIES[sortOrder];
    
    // Check if parent exists
    let parent = await prisma.category.findFirst({
      where: {
        name: cat.name,
        type: cat.type,
        isSystem: true,
        householdId: null,
      },
    });

    if (!parent) {
      parent = await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
          sortOrder,
        },
      });
      console.log(`Created system category: ${cat.name}`);
    } else {
      // Update details to match seed definitions
      parent = await prisma.category.update({
        where: { id: parent.id },
        data: {
          icon: cat.icon,
          color: cat.color,
          sortOrder,
        },
      });
      console.log(`Updated system category: ${cat.name}`);
    }

    // Handle subcategories
    for (let subSort = 0; subSort < cat.subcategories.length; subSort++) {
      const subName = cat.subcategories[subSort];
      
      const sub = await prisma.category.findFirst({
        where: {
          name: subName,
          type: cat.type,
          parentId: parent.id,
          isSystem: true,
          householdId: null,
        },
      });

      if (!sub) {
        await prisma.category.create({
          data: {
            name: subName,
            type: cat.type,
            parentId: parent.id,
            isSystem: true,
            sortOrder: subSort,
          },
        });
        console.log(`  -> Created subcategory: ${subName}`);
      } else {
        await prisma.category.update({
          where: { id: sub.id },
          data: { sortOrder: subSort },
        });
      }
    }
  }

  console.log('Category seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
