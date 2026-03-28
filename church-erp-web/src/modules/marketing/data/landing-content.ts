import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  ChartColumn,
  Clock3,
  Coins,
  Layers3,
  ShieldCheck,
  Users,
} from "lucide-react";

export const phoneRaw = "5500000000000";
export const phoneDisplay = "(00) 00000-0000";
export const defaultWhatsappMessage =
  "Olá! Quero conversar sobre o Igreja ERP e entender como ele pode apoiar a organização da nossa igreja.";

export function getWhatsappHref() {
  const resolvedPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || phoneRaw;
  const resolvedMessage =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() || defaultWhatsappMessage;

  return `https://wa.me/${resolvedPhone}?text=${encodeURIComponent(resolvedMessage)}`;
}

export interface LandingAction {
  label: string;
  href: string;
}

export interface LandingNavigationItem {
  label: string;
  href: string;
}

export interface LandingStat {
  value: string;
  label: string;
  description: string;
}

export interface LandingSignal {
  label: string;
  value: string;
}

export interface LandingColumn {
  title: string;
  items: string[];
}

export interface LandingPoint {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface LandingHeroContent {
  badge: string;
  title: string;
  description: string;
  primaryAction: LandingAction;
  secondaryAction: LandingAction;
  highlights: string[];
  stats: LandingStat[];
  showcase: {
    badge: string;
    title: string;
    description: string;
    signals: LandingSignal[];
    columns: LandingColumn[];
    note: string;
  };
}

export interface LandingAboutContent {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  secondaryDescription: string;
  pillars: LandingPoint[];
}

export interface LandingFeaturesContent {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: LandingPoint[];
}

export interface LandingBenefitsContent {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  spotlight: {
    title: string;
    description: string;
    checklist: string[];
  };
  items: LandingPoint[];
}

export interface LandingCtaContent {
  id: string;
  badge: string;
  title: string;
  description: string;
  primaryAction: LandingAction;
  secondaryAction: LandingAction;
}

export interface LandingFooterContent {
  productLabel: string;
  description: string;
  loginLabel: string;
  legalNote: string;
  note: string;
}

export interface LandingWhatsappContent {
  label: string;
  description: string;
  href: string;
}

export interface LandingContent {
  brandName: string;
  brandLabel: string;
  navigation: LandingNavigationItem[];
  hero: LandingHeroContent;
  about: LandingAboutContent;
  features: LandingFeaturesContent;
  benefits: LandingBenefitsContent;
  cta: LandingCtaContent;
  footer: LandingFooterContent;
  whatsapp: LandingWhatsappContent;
}

export const landingContent = {
  brandName: "Igreja ERP",
  brandLabel: "Plataforma institucional",
  navigation: [
    { label: "Visão geral", href: "#visao-geral" },
    { label: "Destaques", href: "#recursos" },
    { label: "Benefícios", href: "#beneficios" },
    { label: "Contato", href: "#contato" },
  ],
  hero: {
    badge: "Organização, clareza e praticidade para a rotina da igreja",
    title:
      "Centralize informações e acompanhe a administração da igreja com mais segurança no dia a dia.",
    description:
      "O Igreja ERP reúne em um só lugar dados importantes para a gestão da igreja, ajudando a manter a organização administrativa, a gestão de membros, o controle financeiro e o acompanhamento da operação com mais clareza e consistência.",
    primaryAction: {
      label: "Conversar no WhatsApp",
      href: getWhatsappHref(),
    },
    secondaryAction: {
      label: "Entrar no sistema",
      href: "/login",
    },
    highlights: [
      "Informações centralizadas para reduzir desencontro de dados e facilitar a rotina administrativa.",
      "Gestão de membros e acompanhamento da operação com uma visão mais clara do dia a dia da igreja.",
      "Controle financeiro e organização institucional para apoiar decisões com mais tranquilidade.",
    ],
    stats: [
      {
        value: "1 só lugar",
        label: "Informações centralizadas",
        description:
          "Cadastros, acompanhamento e visão administrativa reunidos em uma única experiência.",
      },
      {
        value: "Rotina mais clara",
        label: "Acompanhamento constante",
        description:
          "A igreja acompanha a operação com mais organização e menos retrabalho.",
      },
      {
        value: "Uso prático",
        label: "Dia a dia mais fluido",
        description:
          "A plataforma foi pensada para apoiar uma operação real, com linguagem simples e objetiva.",
      },
    ],
    showcase: {
      badge: "Apresentação institucional",
      title:
        "Uma landing que comunica valor com sobriedade, sem exageros e sem expor fluxos internos.",
      description:
        "A proposta da página é mostrar o valor do Igreja ERP de forma acessível, profissional e adequada ao contexto das igrejas, reforçando organização, confiança e clareza na apresentação.",
      signals: [
        { label: "Organização", value: "Clara" },
        { label: "Comunicação", value: "Acessível" },
        { label: "Posicionamento", value: "Institucional" },
      ],
      columns: [
        {
          title: "Administração",
          items: [
            "Apoio à organização administrativa com visão mais estruturada da rotina.",
            "Centralização das informações para facilitar o acompanhamento da igreja.",
          ],
        },
        {
          title: "Operação",
          items: [
            "Mais clareza para acompanhar membros, movimentações e demandas do dia a dia.",
            "Comunicação objetiva para apresentar o valor da plataforma com seriedade.",
          ],
        },
      ],
      note:
        "Um conteúdo pensado para o primeiro contato comercial, com foco em valor real para igrejas.",
    },
  },
  about: {
    id: "visao-geral",
    eyebrow: "Visão geral",
    title:
      "Uma plataforma pensada para apoiar a organização administrativa da igreja com mais clareza.",
    description:
      "O Igreja ERP foi concebido para ajudar igrejas a manterem suas informações mais organizadas, acessíveis e fáceis de acompanhar. Em vez de depender de controles dispersos, a plataforma reúne o que é importante para a rotina administrativa em um ambiente único.",
    secondaryDescription:
      "Com uma proposta visual sóbria e uma comunicação acessível, a landing reforça a ideia de centralização, praticidade e acompanhamento contínuo da operação, sem recorrer a linguagem excessivamente técnica ou promessas irreais.",
    pillars: [
      {
        title: "Centralização das informações",
        description:
          "Dados importantes da rotina da igreja reunidos em um só lugar para facilitar o acompanhamento e a organização.",
        icon: Layers3,
      },
      {
        title: "Praticidade no dia a dia",
        description:
          "Uma proposta feita para apoiar a rotina administrativa com mais objetividade e menos complexidade.",
        icon: Clock3,
      },
      {
        title: "Postura institucional",
        description:
          "Visual premium e comunicação clara para apresentar a plataforma com sobriedade e confiança.",
        icon: ShieldCheck,
      },
    ],
  },
  features: {
    id: "recursos",
    eyebrow: "Destaques",
    title:
      "Os principais pontos do Igreja ERP apresentados de forma clara, útil e relevante para igrejas.",
    description:
      "O conteúdo da landing valoriza aquilo que faz diferença na rotina: organização administrativa, visão centralizada das informações, acompanhamento da operação e mais praticidade para lidar com o dia a dia da igreja.",
    items: [
      {
        title: "Gestão de membros",
        description:
          "Mais clareza para acompanhar cadastros e informações ligadas à vida da comunidade.",
        icon: Users,
      },
      {
        title: "Controle financeiro",
        description:
          "Apoio ao acompanhamento financeiro com uma visão mais ordenada e confiável da operação.",
        icon: Coins,
      },
      {
        title: "Organização das unidades e igrejas",
        description:
          "Estrutura mais clara para acompanhar diferentes frentes da operação com organização e consistência.",
        icon: Building2,
      },
      {
        title: "Gestão de usuários",
        description:
          "Mais controle sobre o acesso e o acompanhamento de quem apoia a administração da igreja.",
        icon: ShieldCheck,
      },
      {
        title: "Acompanhamento administrativo",
        description:
          "Uma forma mais prática de observar demandas, registros e rotinas que sustentam o dia a dia.",
        icon: BadgeCheck,
      },
      {
        title: "Visão clara da operação",
        description:
          "Leitura mais objetiva do andamento da igreja para apoiar decisões com mais contexto.",
        icon: ChartColumn,
      },
    ],
  },
  benefits: {
    id: "beneficios",
    eyebrow: "Benefícios",
    title:
      "Mais clareza para acompanhar a igreja, mais praticidade para conduzir a rotina administrativa.",
    description:
      "Quando as informações estão centralizadas e a operação pode ser acompanhada com mais consistência, a gestão se torna mais organizada, o dia a dia fica mais fluido e a tomada de decisão ganha mais segurança.",
    spotlight: {
      title: "Valor percebido com objetividade e postura institucional.",
      description:
        "A landing apresenta o Igreja ERP de forma profissional e acessível, destacando ganhos concretos para igrejas sem recorrer a promessas exageradas ou linguagem genérica de tecnologia.",
      checklist: [
        "Comunicação clara para liderança, equipe administrativa e responsáveis pela operação.",
        "Ênfase em organização, centralização das informações e acompanhamento do dia a dia.",
        "Convite direto para contato comercial e entrada no sistema.",
      ],
    },
    items: [
      {
        title: "Menos processos manuais",
        description:
          "A centralização das informações reduz controles espalhados e simplifica atividades recorrentes.",
        icon: Clock3,
      },
      {
        title: "Mais organização",
        description:
          "A rotina administrativa ganha mais ordem, previsibilidade e clareza para quem acompanha a operação.",
        icon: Layers3,
      },
      {
        title: "Informações centralizadas",
        description:
          "Dados importantes ficam reunidos em um ambiente mais consistente e fácil de consultar.",
        icon: BadgeCheck,
      },
      {
        title: "Apoio à administração",
        description:
          "A plataforma contribui para uma gestão mais segura, com melhor acompanhamento das demandas do dia a dia.",
        icon: ShieldCheck,
      },
      {
        title: "Mais clareza nas rotinas",
        description:
          "A igreja acompanha melhor o que acontece na operação e consegue agir com mais contexto.",
        icon: ChartColumn,
      },
      {
        title: "Base mais confiável para decisões",
        description:
          "Com uma visão mais organizada da operação, decisões importantes podem ser tomadas com mais tranquilidade.",
        icon: ShieldCheck,
      },
    ],
  },
  cta: {
    id: "contato",
    badge: "Converse com nossa equipe",
    title:
      "Veja como o Igreja ERP pode apoiar a organização e o acompanhamento da sua igreja.",
    description:
      "Se a sua igreja busca mais clareza para administrar informações, acompanhar membros, organizar a rotina e ter mais controle no dia a dia, o próximo passo pode começar em uma conversa simples no WhatsApp.",
    primaryAction: {
      label: "Conversar no WhatsApp",
      href: getWhatsappHref(),
    },
    secondaryAction: {
      label: "Entrar no sistema",
      href: "/login",
    },
  },
  footer: {
    productLabel: "Plataforma institucional",
    description:
      "O Igreja ERP apoia a organização administrativa, a centralização das informações, a gestão de membros, o controle financeiro e o acompanhamento da operação da igreja com uma proposta clara e acessível.",
    loginLabel: "Entrar no sistema",
    legalNote: "Todos os direitos reservados.",
    note: "Conteúdo institucional com foco em valor real para igrejas.",
  },
  whatsapp: {
    label: "Conversar no WhatsApp",
    description:
      "Fale com nossa equipe para entender como o Igreja ERP pode apoiar a rotina administrativa da sua igreja.",
    href: getWhatsappHref(),
  },
} satisfies LandingContent;

export type LandingBrandName = LandingContent["brandName"];
export type LandingHeroSection = LandingContent["hero"];
export type LandingAboutSection = LandingContent["about"];
export type LandingFeaturesSection = LandingContent["features"];
export type LandingBenefitsSection = LandingContent["benefits"];
export type LandingCtaSection = LandingContent["cta"];
export type LandingFooterSection = LandingContent["footer"];
