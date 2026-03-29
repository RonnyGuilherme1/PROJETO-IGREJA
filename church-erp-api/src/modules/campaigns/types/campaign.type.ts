import { Prisma } from '@prisma/client';

const campaignInstallmentBaseSelect = {
  id: true,
  campaignMemberId: true,
  installmentNumber: true,
  amount: true,
  dueDate: true,
  status: true,
  paidAt: true,
  notes: true,
} satisfies Prisma.CampaignInstallmentSelect;

export const campaignInstallmentSelect =
  Prisma.validator<Prisma.CampaignInstallmentSelect>()(
    campaignInstallmentBaseSelect,
  );

const campaignMemberBaseSelect = {
  id: true,
  campaignId: true,
  memberId: true,
  joinedAt: true,
  notes: true,
  member: {
    select: {
      id: true,
      fullName: true,
    },
  },
  installments: {
    select: campaignInstallmentSelect,
    orderBy: {
      installmentNumber: 'asc',
    },
  },
} satisfies Prisma.CampaignMemberSelect;

export const campaignMemberSelect =
  Prisma.validator<Prisma.CampaignMemberSelect>()(campaignMemberBaseSelect);

const campaignBaseSelect = {
  id: true,
  tenantId: true,
  churchId: true,
  title: true,
  description: true,
  imageUrl: true,
  installmentCount: true,
  installmentAmount: true,
  startDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  church: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      members: true,
    },
  },
} satisfies Prisma.CampaignSelect;

export const campaignSelect = Prisma.validator<Prisma.CampaignSelect>()(
  campaignBaseSelect,
);

export const campaignDetailSelect =
  Prisma.validator<Prisma.CampaignSelect>()({
    ...campaignBaseSelect,
    members: {
      select: campaignMemberSelect,
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    },
  });

export type CampaignInstallmentEntity = Prisma.CampaignInstallmentGetPayload<{
  select: typeof campaignInstallmentSelect;
}>;

export type CampaignMemberEntity = Prisma.CampaignMemberGetPayload<{
  select: typeof campaignMemberSelect;
}>;

export type CampaignEntity = Prisma.CampaignGetPayload<{
  select: typeof campaignSelect;
}>;

export type CampaignDetailEntity = Prisma.CampaignGetPayload<{
  select: typeof campaignDetailSelect;
}>;
