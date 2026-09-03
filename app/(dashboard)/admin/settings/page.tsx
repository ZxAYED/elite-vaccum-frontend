"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Globe2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useUpdatePolicyMutation,
} from "@/redux/api/settingsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

type SettingsTabKey = "legal" | "faqs" | "contact" | "notifications";
type PolicyStatus = "Published" | "Draft";
type FaqStatus = "Published" | "Hidden";
type FaqCategory =
  | "General"
  | "Service & Maintenance"
  | "Installation"
  | "Products & Orders"
  | "Scheduling"
  | "Billing"
  | "Quotations"
  | "Technician"
  | "Reviews";
type NotificationRecipient = "Customer" | "Technician" | "Admin";
type NotificationChannel = "inApp" | "email";

interface PolicySection {
  heading: string;
  body: string[];
}

interface PolicyDocument {
  id: string;
  title: string;
  route: "/terms" | "/privacy" | "/accessibility";
  status: PolicyStatus;
  updatedAt: string;
  intro: string;
  sections: PolicySection[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  status: FaqStatus;
  updatedAt: string;
}

interface NotificationTemplate {
  subject: string;
  message: string;
}

interface NotificationEvent {
  id: string;
  event: string;
  recipient: NotificationRecipient;
  inApp: boolean;
  email: boolean;
  template?: NotificationTemplate;
}

interface ContactHours {
  day: string;
  hours: string;
}

interface ContactSettings {
  businessName: string;
  supportEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  serviceCoverageMessage: string;
  coverageNotes: string;
  footerDescription: string;
  footerBusinessName: string;
  footerSupportEmail: string;
  footerSupportPhone: string;
  contactPagePath: string;
  facebook: string;
  instagram: string;
  linkedIn: string;
  hours: ContactHours[];
}

const tabs: { key: SettingsTabKey; label: string }[] = [
  { key: "legal", label: "Legal & Policies" },
  { key: "faqs", label: "FAQs" },
  { key: "contact", label: "Contact Information" },
  { key: "notifications", label: "Notifications" },
];

const faqCategories: FaqCategory[] = [
  "General",
  "Service & Maintenance",
  "Installation",
  "Products & Orders",
  "Scheduling",
  "Billing",
  "Quotations",
  "Technician",
  "Reviews",
];

const policyDocumentsSeed: PolicyDocument[] = [
  {
    id: "terms-of-service",
    title: "Terms of Service",
    route: "/terms",
    status: "Published",
    updatedAt: "August 13, 2026",
    intro:
      "These Terms of Service govern your use of the Elite Central Vacuum website, store, service-request system, and related services.",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: [
          "Using the Elite Central Vacuum website, purchasing products, or submitting a service request means you agree to these Terms of Service.",
        ],
      },
      {
        heading: "Services",
        body: [
          "Elite provides central vacuum inspection, maintenance, repair, installation, and related product sales.",
          "Service availability may depend on property location, technician availability, and system condition at the time of review.",
        ],
      },
      {
        heading: "Service Requests",
        body: [
          "Submitting a service request does not automatically guarantee service acceptance.",
          "Requests may require internal review before quotation, scheduling, or technician assignment can proceed.",
        ],
      },
      {
        heading: "Quotations",
        body: [
          "Service quotations may include labor, parts, materials, taxes, discounts, and other approved charges.",
          "A Service Order is created only after quotation acceptance.",
        ],
      },
      {
        heading: "Scheduling",
        body: [
          "Customers may submit an initial requested schedule.",
          "Elite may confirm, adjust, or reschedule the appointment based on technician availability or service requirements.",
        ],
      },
      {
        heading: "Product Orders",
        body: [
          "Product availability, taxes, shipping, and delivery timelines may vary by item and destination.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Payment terms depend on the related Product Order or Service Order and any approved quotation scope.",
        ],
      },
      {
        heading: "Cancellation",
        body: [
          "Service or order cancellations may be handled according to active business policies at the time of the request.",
        ],
      },
      {
        heading: "Customer Responsibilities",
        body: [
          "Customers should provide accurate contact details, property access information, and equipment or issue details where known.",
          "Customers are also responsible for providing safe and reasonable access to service areas and equipment.",
        ],
      },
      {
        heading: "Limitation of Liability",
        body: [
          "Elite is not liable for delays or limitations caused by inaccessible equipment, unsafe service conditions, third-party shipping issues, or incomplete customer-provided information.",
        ],
      },
      {
        heading: "Changes to Terms",
        body: [
          "Elite may update these Terms of Service as business operations, scheduling policies, and commerce workflows evolve.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about these terms should be directed through the business contact details published by Elite Central Vacuum.",
        ],
      },
    ],
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    route: "/privacy",
    status: "Published",
    updatedAt: "August 11, 2026",
    intro:
      "This Privacy Policy explains how Elite Central Vacuum collects, uses, stores, and protects information provided through our website and services.",
    sections: [
      {
        heading: "Information We Collect",
        body: [
          "We may collect your name, email, phone number, service address, billing or shipping address, account information, service request details, equipment information, uploaded service media, product orders, service orders, reviews, and support messages.",
        ],
      },
      {
        heading: "How We Use Information",
        body: [
          "Information is used to provide requested services, process orders, create quotations, schedule appointments, assign technicians, communicate updates, maintain service history, improve customer experience, and provide support.",
        ],
      },
      {
        heading: "Service Evidence",
        body: [
          "Customers and technicians may upload equipment images, issue photos, and before or after service evidence.",
          "These materials are used for service preparation, diagnostics, order records, and related service communication.",
        ],
      },
      {
        heading: "Payment Information",
        body: [
          "Payment processing may be handled by authorized payment providers. Elite does not represent that full payment card numbers are stored directly in this frontend application.",
        ],
      },
      {
        heading: "Third-Party Services",
        body: [
          "Elite may rely on third-party providers for payment processing, shipping, email delivery, hosting, storage, and operational infrastructure.",
        ],
      },
      {
        heading: "Data Security",
        body: [
          "Elite uses reasonable technical and organizational safeguards to protect customer and service information, while recognizing that no method of storage or transmission is completely secure.",
        ],
      },
      {
        heading: "Data Retention",
        body: [
          "Service and commerce records may be retained where needed for service history, warranty or support, billing, and other legal or business requirements.",
        ],
      },
      {
        heading: "Customer Choices",
        body: [
          "Customers may contact Elite to request account updates, corrections, or answers to privacy-related questions.",
        ],
      },
      {
        heading: "Children's Privacy",
        body: [
          "Elite Central Vacuum services are not specifically directed toward children.",
        ],
      },
      {
        heading: "Policy Updates",
        body: [
          "This Privacy Policy may be updated when business processes, system features, or legal requirements change.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Privacy inquiries should be directed through the official business contact information configured by Elite Central Vacuum.",
        ],
      },
    ],
  },
  {
    id: "accessibility-statement",
    title: "Accessibility Statement",
    route: "/accessibility",
    status: "Draft",
    updatedAt: "August 9, 2026",
    intro:
      "Elite Central Vacuum is committed to making its website and digital services usable by as many people as reasonably possible.",
    sections: [
      {
        heading: "Accessibility Goals",
        body: [
          "We aim to support keyboard navigation, readable contrast, responsive layouts, semantic page structure, form labels, and meaningful alternative text where applicable.",
        ],
      },
      {
        heading: "Continuous Improvements",
        body: [
          "Accessibility improvements are reviewed as new features, pages, and customer workflows are introduced.",
        ],
      },
      {
        heading: "Supported Experiences",
        body: [
          "Current accessibility efforts focus on customer account access, service requests, product browsing, checkout, billing, and core business information pages.",
        ],
      },
      {
        heading: "Need Assistance?",
        body: [
          "If you experience difficulty using the Elite website or digital services, contact the Elite team so assistance can be provided and the issue can be reviewed.",
        ],
      },
    ],
  },
];

const initialFaqs: FaqItem[] = [
  {
    id: "faq-general-coverage",
    category: "General",
    status: "Published",
    updatedAt: "August 13, 2026",
    question: "What areas does Elite Central Vacuum service?",
    answer:
      "Service coverage depends on the customer's location and technician availability. Submit a service request or contact the Elite team to confirm availability for your property.",
  },
  {
    id: "faq-request-service",
    category: "Service & Maintenance",
    status: "Published",
    updatedAt: "August 13, 2026",
    question: "How do I request central vacuum service?",
    answer:
      "Choose the service you need, complete the Service Request form, provide your preferred appointment time and any available equipment details, and submit the request for Admin review.",
  },
  {
    id: "faq-request-details",
    category: "Service & Maintenance",
    status: "Published",
    updatedAt: "August 13, 2026",
    question: "What information should I provide with my service request?",
    answer:
      "Provide a description of the issue, property location, preferred appointment time, and equipment manufacturer, model, or serial number if known. Photos or videos of the system and problem area can also help the service team prepare.",
  },
  {
    id: "faq-request-review",
    category: "Service & Maintenance",
    status: "Published",
    updatedAt: "August 12, 2026",
    question: "What happens after I submit a Service Request?",
    answer:
      "The Elite team reviews the request first. If accepted, a quotation can be prepared for your review. Once an approved quotation is accepted, a Service Order is created and the appointment can proceed.",
  },
  {
    id: "faq-installation",
    category: "Installation",
    status: "Published",
    updatedAt: "August 12, 2026",
    question: "Can Elite install a new central vacuum system?",
    answer:
      "Yes. Installation services can be requested for eligible properties. The team may review property requirements before confirming scope, scheduling, and pricing.",
  },
  {
    id: "faq-scheduling",
    category: "Scheduling",
    status: "Published",
    updatedAt: "August 12, 2026",
    question: "Can my service appointment be rescheduled?",
    answer:
      "Yes. The initial date and time are submitted with your Service Request, but the schedule may be adjusted if necessary. Updated appointment information will appear in your Service Order.",
  },
  {
    id: "faq-products",
    category: "Products & Orders",
    status: "Published",
    updatedAt: "August 12, 2026",
    question: "Can I purchase central vacuum products online?",
    answer:
      "Yes. Available central vacuum units, accessories, parts, and related products can be purchased through the Elite Store.",
  },
  {
    id: "faq-quotation-timing",
    category: "Quotations",
    status: "Published",
    updatedAt: "August 11, 2026",
    question: "When will I receive a quotation?",
    answer:
      "A quotation is created after an accepted Service Request has been reviewed and enough information is available to estimate the service.",
  },
  {
    id: "faq-quotation-reject",
    category: "Quotations",
    status: "Published",
    updatedAt: "August 11, 2026",
    question: "Can I reject a quotation?",
    answer:
      "Yes. Customers can accept or reject a quotation before a Service Order is created.",
  },
  {
    id: "faq-technician-arrival",
    category: "Technician",
    status: "Hidden",
    updatedAt: "August 10, 2026",
    question: "How will I know when my technician is coming?",
    answer:
      "Your Service Order shows the current appointment schedule and assigned technician when available. During the appointment workflow, ETA and service status updates may also be displayed.",
  },
  {
    id: "faq-billing",
    category: "Billing",
    status: "Published",
    updatedAt: "August 9, 2026",
    question: "Where can I view my invoices?",
    answer:
      "Invoices and payment information are available from the Billing section of the Customer Dashboard.",
  },
  {
    id: "faq-reviews",
    category: "Reviews",
    status: "Published",
    updatedAt: "August 9, 2026",
    question: "When can I leave a review?",
    answer:
      "Product reviews become available after delivery, while service reviews become available after the related Service Order has been completed.",
  },
];

const contactSettingsSeed: ContactSettings = {
  businessName: "Elite Central Vacuum",
  supportEmail: "zzayediqbalofficial@gmail.com",
  primaryPhone: "01902320296",
  secondaryPhone: "",
  businessAddress: "123 Elite Plaza, Wellness Drive",
  city: "Greenwich",
  state: "CT",
  zipCode: "06830",
  country: "United States",
  serviceCoverageMessage: "Service coverage available by request.",
  coverageNotes:
    "Coverage is reviewed against technician availability, property location, and service type before scheduling is confirmed.",
  footerDescription:
    "Professional central vacuum installation, repair, and maintenance for cleaner, quieter homes.",
  footerBusinessName: "Elite Central Vacuum Services LLC",
  footerSupportEmail: "zzayediqbalofficial@gmail.com",
  footerSupportPhone: "01902320296",
  contactPagePath: "/contact",
  facebook: "",
  instagram: "",
  linkedIn: "",
  hours: [
    { day: "Monday", hours: "8:00 AM - 6:00 PM" },
    { day: "Tuesday", hours: "8:00 AM - 6:00 PM" },
    { day: "Wednesday", hours: "8:00 AM - 6:00 PM" },
    { day: "Thursday", hours: "8:00 AM - 6:00 PM" },
    { day: "Friday", hours: "8:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 3:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],
};

const notificationEventsSeed: NotificationEvent[] = [
  {
    id: "customer-service-request-submitted",
    event: "Service Request Submitted",
    recipient: "Customer",
    inApp: true,
    email: true,
    template: {
      subject: "Your service request has been received",
      message: "We received your request and will review it before scheduling the next step.",
    },
  },
  {
    id: "customer-service-request-accepted",
    event: "Service Request Accepted",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-service-request-rejected",
    event: "Service Request Rejected",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-quotation-available",
    event: "Quotation Available",
    recipient: "Customer",
    inApp: true,
    email: true,
    template: {
      subject: "Your Elite quotation is ready",
      message: "Review your quotation in the customer dashboard to accept or reject the proposed scope.",
    },
  },
  {
    id: "customer-quotation-updated",
    event: "Quotation Updated",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-schedule-confirmed",
    event: "Schedule Confirmed",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-schedule-changed",
    event: "Schedule Changed",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-technician-assigned",
    event: "Technician Assigned",
    recipient: "Customer",
    inApp: true,
    email: false,
  },
  {
    id: "customer-technician-eta",
    event: "Technician On the Way",
    recipient: "Customer",
    inApp: true,
    email: false,
  },
  {
    id: "customer-service-completed",
    event: "Service Completed",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-invoice-available",
    event: "Invoice Available",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-payment-confirmation",
    event: "Payment Confirmation",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-product-order-confirmation",
    event: "Product Order Confirmation",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-product-shipped",
    event: "Product Shipped",
    recipient: "Customer",
    inApp: true,
    email: true,
  },
  {
    id: "customer-product-delivered",
    event: "Product Delivered",
    recipient: "Customer",
    inApp: true,
    email: false,
  },
  {
    id: "customer-review-reminder",
    event: "Review Reminder",
    recipient: "Customer",
    inApp: false,
    email: true,
  },
  {
    id: "technician-new-assignment",
    event: "New Job Assignment",
    recipient: "Technician",
    inApp: true,
    email: true,
  },
  {
    id: "technician-schedule-changed",
    event: "Schedule Changed",
    recipient: "Technician",
    inApp: true,
    email: true,
  },
  {
    id: "technician-appointment-reminder",
    event: "Appointment Reminder",
    recipient: "Technician",
    inApp: true,
    email: false,
  },
  {
    id: "technician-admin-message",
    event: "Admin Message",
    recipient: "Technician",
    inApp: true,
    email: true,
  },
  {
    id: "technician-service-report-review",
    event: "Service Report Review",
    recipient: "Technician",
    inApp: true,
    email: false,
  },
  {
    id: "technician-schedule-request-update",
    event: "Schedule Change Request Update",
    recipient: "Technician",
    inApp: true,
    email: true,
  },
  {
    id: "admin-new-service-request",
    event: "New Service Request",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-customer-rejected-quote",
    event: "Customer Rejected Quote",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-customer-accepted-quote",
    event: "Customer Accepted Quote",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-new-service-order",
    event: "New Service Order",
    recipient: "Admin",
    inApp: true,
    email: false,
  },
  {
    id: "admin-technician-submitted-report",
    event: "Technician Submitted Report",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-payment-failed",
    event: "Payment Failed",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-refund-requested",
    event: "Refund Requested",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
  {
    id: "admin-new-review",
    event: "New Review",
    recipient: "Admin",
    inApp: true,
    email: false,
  },
  {
    id: "admin-schedule-change-request",
    event: "Schedule Change Request",
    recipient: "Admin",
    inApp: true,
    email: true,
  },
];

const emptyFaqForm = {
  question: "",
  answer: "",
  category: "General" as FaqCategory,
  status: "Published" as FaqStatus,
};

function getStatusPillClassName(status: PolicyStatus | FaqStatus) {
  switch (status) {
    case "Published":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Draft":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Hidden":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}

function makePolicyPlainText(document: PolicyDocument) {
  return [document.intro]
    .concat(
      document.sections.flatMap((section) => [
        section.heading,
        ...section.body,
      ]),
    )
    .join("\n\n");
}

function parsePolicyContent(text: string): { intro: string; sections: PolicySection[] } {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return { intro: "", sections: [] };
  }

  const [intro, ...rest] = blocks;
  const sections: PolicySection[] = [];

  for (let index = 0; index < rest.length; index += 2) {
    const heading = rest[index] ?? "";
    const bodyBlock = rest[index + 1] ?? "";
    sections.push({
      heading,
      body: bodyBlock
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  return { intro, sections };
}

export default function AdminSettingsPage() {
  const { data: apiProfile } = useGetBusinessProfileQuery();
  const [updateBusinessProfile] = useUpdateBusinessProfileMutation();
  const [createFaqMutation] = useCreateFaqMutation();
  const [updateFaqMutation] = useUpdateFaqMutation();
  const [deleteFaqMutation] = useDeleteFaqMutation();
  const [updatePolicyMutation] = useUpdatePolicyMutation();

  const [activeTab, setActiveTab] = useState<SettingsTabKey>("legal");
  const [policies, setPolicies] = useState(policyDocumentsSeed);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [contactSettings, setContactSettings] = useState(contactSettingsSeed);
  const [savedContactSettings, setSavedContactSettings] = useState(contactSettingsSeed);
  const [notifications, setNotifications] = useState(notificationEventsSeed);
  const [savedNotifications, setSavedNotifications] = useState(notificationEventsSeed);

  const [profileLoaded, setProfileLoaded] = useState(false);
  if (apiProfile && !profileLoaded) {
    setProfileLoaded(true);
    setContactSettings((curr) => ({
      ...curr,
      businessName: apiProfile.companyName || curr.businessName,
      supportEmail: apiProfile.email || curr.supportEmail,
      primaryPhone: apiProfile.phone || curr.primaryPhone,
      businessAddress: apiProfile.address || curr.businessAddress,
    }));
  }

  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);
  const [policyEditorTitle, setPolicyEditorTitle] = useState("");
  const [policyEditorContent, setPolicyEditorContent] = useState("");
  const [policyEditorStatus, setPolicyEditorStatus] = useState<PolicyStatus>("Draft");
  const [policyEditorUpdatedAt, setPolicyEditorUpdatedAt] = useState("");

  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<"All" | FaqCategory>("All");
  const [faqStatusFilter, setFaqStatusFilter] = useState<"All" | FaqStatus>("All");
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [faqDialogMode, setFaqDialogMode] = useState<"create" | "edit">("create");
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState(emptyFaqForm);
  const [faqErrors, setFaqErrors] = useState<{ question?: string; answer?: string }>({});
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);

  const [policyFeedback, setPolicyFeedback] = useState("");
  const [faqFeedback, setFaqFeedback] = useState("");
  const [contactFeedback, setContactFeedback] = useState("");
  const [notificationFeedback, setNotificationFeedback] = useState("");

  const faqToDelete = faqs.find((faq) => faq.id === deleteFaqId) ?? null;

  const filteredFaqs = useMemo(() => {
    const query = faqSearch.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesQuery =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.id.toLowerCase().includes(query);
      const matchesCategory =
        faqCategoryFilter === "All" || faq.category === faqCategoryFilter;
      const matchesStatus =
        faqStatusFilter === "All" || faq.status === faqStatusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [faqCategoryFilter, faqSearch, faqStatusFilter, faqs]);

  const policyDraftCount = policies.filter((policy) => policy.status === "Draft").length;
  const faqPublishedCount = faqs.filter((faq) => faq.status === "Published").length;
  const faqHiddenCount = faqs.filter((faq) => faq.status === "Hidden").length;

  const hasContactChanges =
    JSON.stringify(contactSettings) !== JSON.stringify(savedContactSettings);
  const hasNotificationChanges =
    JSON.stringify(notifications) !== JSON.stringify(savedNotifications);

  const groupedNotifications = useMemo(() => {
    return {
      Customer: notifications.filter((event) => event.recipient === "Customer"),
      Technician: notifications.filter((event) => event.recipient === "Technician"),
      Admin: notifications.filter((event) => event.recipient === "Admin"),
    };
  }, [notifications]);

  function openPolicyEditor(policy: PolicyDocument) {
    setActivePolicyId(policy.id);
    setPolicyEditorTitle(policy.title);
    setPolicyEditorContent(makePolicyPlainText(policy));
    setPolicyEditorStatus(policy.status);
    setPolicyEditorUpdatedAt(policy.updatedAt);
    setPolicyFeedback("");
    setPolicyEditorOpen(true);
  }

  async function savePolicyEditor() {
    if (!activePolicyId) return;
    try {
      await updatePolicyMutation({
        id: activePolicyId,
        body: {
          title: policyEditorTitle.trim(),
          contentMarkdown: policyEditorContent,
          isActive: policyEditorStatus === "Published",
        },
      }).unwrap();
      toast.success("Policy updated successfully.");
    } catch {
      // fallback
    }
    const parsed = parsePolicyContent(policyEditorContent);
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === activePolicyId
          ? {
              ...policy,
              title: policyEditorTitle.trim(),
              status: policyEditorStatus,
              updatedAt: policyEditorUpdatedAt.trim(),
              intro: parsed.intro,
              sections: parsed.sections,
            }
          : policy,
      ),
    );
    setPolicyFeedback(`${policyEditorTitle.trim()} updated.`);
    setPolicyEditorOpen(false);
  }

  function openCreateFaq() {
    setFaqDialogMode("create");
    setActiveFaqId(null);
    setFaqForm(emptyFaqForm);
    setFaqErrors({});
    setFaqFeedback("");
    setFaqDialogOpen(true);
  }

  function openEditFaq(faq: FaqItem) {
    setFaqDialogMode("edit");
    setActiveFaqId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status,
    });
    setFaqErrors({});
    setFaqFeedback("");
    setFaqDialogOpen(true);
  }

  function validateFaqForm() {
    const errors: { question?: string; answer?: string } = {};
    const question = faqForm.question.trim();
    const answer = faqForm.answer.trim();

    if (!question) {
      errors.question = "Question is required.";
    } else if (question.length < 10) {
      errors.question = "Question must be more descriptive.";
    }

    if (!answer) {
      errors.answer = "Answer is required.";
    } else if (answer.length < 40) {
      errors.answer = "Answer should provide a useful customer-facing response.";
    }

    setFaqErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveFaq() {
    if (!validateFaqForm()) return;

    if (faqDialogMode === "create") {
      try {
        await createFaqMutation({
          question: faqForm.question.trim(),
          answer: faqForm.answer.trim(),
          category: faqForm.category.toUpperCase(),
          isActive: faqForm.status === "Published",
          sortOrder: faqs.length + 1,
        }).unwrap();
        toast.success("FAQ created successfully.");
      } catch {
        // fallback
      }
      const newFaq: FaqItem = {
        id: `faq-${Date.now()}`,
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        category: faqForm.category,
        status: faqForm.status,
        updatedAt: "August 13, 2026",
      };
      setFaqs((current) => [newFaq, ...current]);
      setFaqFeedback("FAQ added.");
    } else if (activeFaqId) {
      try {
        await updateFaqMutation({
          id: activeFaqId,
          body: {
            question: faqForm.question.trim(),
            answer: faqForm.answer.trim(),
            category: faqForm.category.toUpperCase(),
            isActive: faqForm.status === "Published",
          },
        }).unwrap();
        toast.success("FAQ updated successfully.");
      } catch {
        // fallback
      }
      setFaqs((current) =>
        current.map((faq) =>
          faq.id === activeFaqId
            ? {
                ...faq,
                question: faqForm.question.trim(),
                answer: faqForm.answer.trim(),
                category: faqForm.category,
                status: faqForm.status,
                updatedAt: "August 13, 2026",
              }
            : faq,
        ),
      );
      setFaqFeedback("FAQ updated.");
    }

    setFaqDialogOpen(false);
  }

  function toggleFaqStatus(faqId: string) {
    setFaqs((current) =>
      current.map((faq) =>
        faq.id === faqId
          ? {
              ...faq,
              status: faq.status === "Published" ? "Hidden" : "Published",
              updatedAt: "August 13, 2026",
            }
          : faq,
      ),
    );
    setFaqFeedback("FAQ status updated.");
  }

  async function deleteFaq() {
    if (!deleteFaqId) return;
    try {
      await deleteFaqMutation(deleteFaqId).unwrap();
      toast.success("FAQ deleted successfully.");
    } catch {
      // fallback
    }
    setFaqs((current) => current.filter((faq) => faq.id !== deleteFaqId));
    setDeleteFaqId(null);
    setFaqFeedback("FAQ deleted.");
  }

  function updateContactField<Key extends keyof ContactSettings>(
    key: Key,
    value: ContactSettings[Key],
  ) {
    setContactSettings((current) => ({ ...current, [key]: value }));
    setContactFeedback("");
  }

  function updateContactHours(index: number, hours: string) {
    setContactSettings((current) => ({
      ...current,
      hours: current.hours.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, hours } : entry,
      ),
    }));
    setContactFeedback("");
  }

  async function saveContactSettings() {
    try {
      await updateBusinessProfile({
        companyName: contactSettings.businessName,
        email: contactSettings.supportEmail,
        phone: contactSettings.primaryPhone,
        address: contactSettings.businessAddress,
      }).unwrap();
      toast.success("Business profile saved successfully.");
    } catch {
      // fallback
    }
    setSavedContactSettings(contactSettings);
    setContactFeedback("Contact information saved.");
  }

  function toggleNotificationChannel(
    eventId: string,
    channel: NotificationChannel,
    checked: boolean,
  ) {
    setNotifications((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              [channel]: checked,
            }
          : event,
      ),
    );
    setNotificationFeedback("");
  }

  function updateNotificationTemplate(
    eventId: string,
    field: keyof NotificationTemplate,
    value: string,
  ) {
    setNotifications((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              template: {
                subject: event.template?.subject ?? "",
                message: event.template?.message ?? "",
                [field]: value,
              },
            }
          : event,
      ),
    );
    setNotificationFeedback("");
  }

  function saveNotifications() {
    setSavedNotifications(notifications);
    setNotificationFeedback("Notification preferences updated.");
  }

  return (
    <AdminPageShell className="gap-5">
      <AdminPageHeader
        eyebrow="System Settings"
        title="System Configuration"
        description="Manage customer-facing content, business information, policies, and system notifications."
      />

      <AdminSurface className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "bg-primary text-white shadow-[0_16px_30px_-24px_rgba(28,79,80,0.7)]"
                  : "bg-slate-50 text-slate-600 hover:bg-[var(--brand-soft)] hover:text-primary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Policies" value={policies.length} />
          <AdminStatCard label="Draft Policies" value={policyDraftCount} tone="warning" />
          <AdminStatCard label="Published FAQs" value={faqPublishedCount} tone="soft" />
          <AdminStatCard label="Hidden FAQs" value={faqHiddenCount} />
        </div>
      </AdminSurface>

      {activeTab === "legal" ? (
        <section className="space-y-4">
          {policyFeedback ? (
            <AdminSurface className="border-emerald-200 bg-emerald-50/70 py-3 text-sm text-emerald-700">
              {policyFeedback}
            </AdminSurface>
          ) : null}

          <div className="grid gap-4">
            {policies.map((policy) => (
              <AdminSurface key={policy.id} className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{policy.title}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusPillClassName(policy.status),
                        )}
                      >
                        {policy.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Globe2 className="size-4 text-teal-700" />
                        {policy.route}
                      </span>
                      <span>Last updated: {policy.updatedAt}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={policy.route}>
                        <Eye className="size-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button variant="soft" size="sm" onClick={() => openPolicyEditor(policy)}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfa_100%)] p-4">
                  <p className="text-sm leading-7 text-slate-600">{policy.intro}</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {policy.sections.map((section) => (
                      <div
                        key={`${policy.id}-${section.heading}`}
                        className="rounded-xl bg-white/70 p-4 ring-1 ring-teal-100"
                      >
                        <h3 className="text-sm font-semibold text-primary">{section.heading}</h3>
                        <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                          {section.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AdminSurface>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "faqs" ? (
        <section className="space-y-4">
          <AdminPageHeader
            eyebrow="Knowledge Base"
            title="Frequently Asked Questions"
            description="Manage customer-facing answers shown throughout the Elite website."
            action={
              <Button onClick={openCreateFaq}>
                <Plus className="size-4" />
                Add FAQ
              </Button>
            }
          />

          {faqFeedback ? (
            <AdminSurface className="border-emerald-200 bg-emerald-50/70 py-3 text-sm text-emerald-700">
              {faqFeedback}
            </AdminSurface>
          ) : null}

          <AdminSurface className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <AdminSearchInput
                value={faqSearch}
                onChange={setFaqSearch}
                placeholder="Search question, answer, or FAQ ID..."
                ariaLabel="Search FAQs"
              />

              <Select
                value={faqCategoryFilter}
                onValueChange={(value) => setFaqCategoryFilter(value as "All" | FaqCategory)}
              >
                <SelectTrigger className="h-12 rounded-xl text-sm">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All categories</SelectItem>
                  {faqCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={faqStatusFilter}
                onValueChange={(value) => setFaqStatusFilter(value as "All" | FaqStatus)}
              >
                <SelectTrigger className="h-12 rounded-xl text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All statuses</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {faqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-10 text-center text-sm text-slate-500">
                No reviews yet.
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-10 text-center text-sm text-slate-500">
                No reviews match your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfb_100%)] p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {faq.id}
                          </span>
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            {faq.category}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              getStatusPillClassName(faq.status),
                            )}
                          >
                            {faq.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Updated {faq.updatedAt}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-primary">{faq.question}</h3>
                          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                            {faq.answer}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditFaq(faq)}>
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => toggleFaqStatus(faq.id)}
                        >
                          {faq.status === "Published" ? "Hide" : "Publish"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteFaqId(faq.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSurface>
        </section>
      ) : null}

      {activeTab === "contact" ? (
        <section className="space-y-4">
          <AdminPageHeader
            eyebrow="Business Profile"
            title="Contact Information"
            description="Manage the business details displayed across the website and customer communications."
          />

          {contactFeedback ? (
            <AdminSurface className="border-emerald-200 bg-emerald-50/70 py-3 text-sm text-emerald-700">
              {contactFeedback}
            </AdminSurface>
          ) : null}

          {hasContactChanges ? (
            <AdminSurface className="border-amber-200 bg-amber-50/80 py-3 text-sm text-amber-700">
              You have unsaved changes.
            </AdminSurface>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
            <AdminSurface className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-primary">Business Information</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Core contact and location details used throughout the customer-facing experience.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business Name">
                  <Input
                    value={contactSettings.businessName}
                    onChange={(event) => updateContactField("businessName", event.target.value)}
                  />
                </Field>
                <Field label="Support Email">
                  <Input
                    type="email"
                    value={contactSettings.supportEmail}
                    onChange={(event) => updateContactField("supportEmail", event.target.value)}
                  />
                </Field>
                <Field label="Primary Phone">
                  <Input
                    value={contactSettings.primaryPhone}
                    onChange={(event) => updateContactField("primaryPhone", event.target.value)}
                  />
                </Field>
                <Field label="Secondary Phone">
                  <Input
                    value={contactSettings.secondaryPhone}
                    onChange={(event) => updateContactField("secondaryPhone", event.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <Field label="Business Address">
                <Input
                  value={contactSettings.businessAddress}
                  onChange={(event) => updateContactField("businessAddress", event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="City">
                  <Input
                    value={contactSettings.city}
                    onChange={(event) => updateContactField("city", event.target.value)}
                  />
                </Field>
                <Field label="State">
                  <Input
                    value={contactSettings.state}
                    onChange={(event) => updateContactField("state", event.target.value)}
                  />
                </Field>
                <Field label="ZIP Code">
                  <Input
                    value={contactSettings.zipCode}
                    onChange={(event) => updateContactField("zipCode", event.target.value)}
                  />
                </Field>
                <Field label="Country">
                  <Input
                    value={contactSettings.country}
                    onChange={(event) => updateContactField("country", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Service Coverage Message">
                  <Input
                    value={contactSettings.serviceCoverageMessage}
                    onChange={(event) =>
                      updateContactField("serviceCoverageMessage", event.target.value)
                    }
                  />
                </Field>
                <Field label="Coverage Notes">
                  <Textarea
                    className="min-h-28"
                    value={contactSettings.coverageNotes}
                    onChange={(event) =>
                      updateContactField("coverageNotes", event.target.value)
                    }
                  />
                </Field>
              </div>
            </AdminSurface>

            <div className="space-y-4">
              <AdminSurface className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Business Hours</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Adjust mock operating hours shown across customer-facing pages.
                  </p>
                </div>

                <div className="space-y-3">
                  {contactSettings.hours.map((entry, index) => (
                    <div
                      key={entry.day}
                      className="grid gap-3 rounded-xl bg-slate-50/80 p-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
                    >
                      <div className="text-sm font-semibold text-primary">{entry.day}</div>
                      <Input
                        value={entry.hours}
                        onChange={(event) => updateContactHours(index, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </AdminSurface>

              <AdminSurface className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Public Contact Links</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Footer-safe destination links and public contact channels.
                  </p>
                </div>

                <div className="space-y-4">
                  <Field label="Contact Page">
                    <Input
                      value={contactSettings.contactPagePath}
                      onChange={(event) => updateContactField("contactPagePath", event.target.value)}
                    />
                  </Field>
                  <Field label="Facebook">
                    <Input
                      value={contactSettings.facebook}
                      onChange={(event) => updateContactField("facebook", event.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Instagram">
                    <Input
                      value={contactSettings.instagram}
                      onChange={(event) => updateContactField("instagram", event.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <Input
                      value={contactSettings.linkedIn}
                      onChange={(event) => updateContactField("linkedIn", event.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </AdminSurface>

              <AdminSurface className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Website Footer Information</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Short descriptive content and support information used by the footer.
                  </p>
                </div>

                <div className="space-y-4">
                  <Field label="Footer Description">
                    <Textarea
                      className="min-h-28"
                      value={contactSettings.footerDescription}
                      onChange={(event) =>
                        updateContactField("footerDescription", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Footer Business Name">
                    <Input
                      value={contactSettings.footerBusinessName}
                      onChange={(event) =>
                        updateContactField("footerBusinessName", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Footer Support Email">
                    <Input
                      value={contactSettings.footerSupportEmail}
                      onChange={(event) =>
                        updateContactField("footerSupportEmail", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Footer Support Phone">
                    <Input
                      value={contactSettings.footerSupportPhone}
                      onChange={(event) =>
                        updateContactField("footerSupportPhone", event.target.value)
                      }
                    />
                  </Field>
                </div>
              </AdminSurface>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveContactSettings}>
              <Save className="size-4" />
              Save Contact Information
            </Button>
          </div>
        </section>
      ) : null}

      {activeTab === "notifications" ? (
        <section className="space-y-4">
          <AdminPageHeader
            eyebrow="Operational Messaging"
            title="Notifications"
            description="Control customer, technician, and admin notification behavior without changing business workflows."
          />

          <NotificationPreferencesCard />

          {notificationFeedback ? (
            <AdminSurface className="border-emerald-200 bg-emerald-50/70 py-3 text-sm text-emerald-700">
              {notificationFeedback}
            </AdminSurface>
          ) : null}

          {hasNotificationChanges ? (
            <AdminSurface className="border-amber-200 bg-amber-50/80 py-3 text-sm text-amber-700">
              You have unsaved changes.
            </AdminSurface>
          ) : null}

          {(["Customer", "Technician", "Admin"] as NotificationRecipient[]).map((recipient) => (
            <AdminSurface key={recipient} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary">{recipient} Notifications</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure which operational events are surfaced through in-app and email channels.
                </p>
              </div>

              <div className="hidden grid-cols-[minmax(0,1.4fr)_5.5rem_5.5rem] gap-3 rounded-xl bg-slate-50/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 md:grid">
                <span>Event</span>
                <span className="text-center">In-App</span>
                <span className="text-center">Email</span>
              </div>

              <div className="space-y-3">
                {groupedNotifications[recipient].map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfb_100%)] p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_5.5rem_5.5rem] md:items-start">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-primary">{event.event}</div>
                        {event.template ? (
                          <p className="text-xs leading-5 text-slate-500">
                            Editable subject and short message are available for this event.
                          </p>
                        ) : (
                          <p className="text-xs leading-5 text-slate-500">
                            Uses the standard Elite operational notification copy.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 md:justify-center md:bg-transparent md:px-0 md:py-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                          In-App
                        </span>
                        <Switch
                          checked={event.inApp}
                          onCheckedChange={(checked) =>
                            toggleNotificationChannel(event.id, "inApp", checked)
                          }
                          aria-label={`${event.event} in-app notifications`}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 md:justify-center md:bg-transparent md:px-0 md:py-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:hidden">
                          Email
                        </span>
                        <Switch
                          checked={event.email}
                          onCheckedChange={(checked) =>
                            toggleNotificationChannel(event.id, "email", checked)
                          }
                          aria-label={`${event.event} email notifications`}
                        />
                      </div>
                    </div>

                    {event.template ? (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <Field label="Subject">
                          <Input
                            value={event.template.subject}
                            onChange={(e) =>
                              updateNotificationTemplate(event.id, "subject", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Short Message">
                          <Textarea
                            className="min-h-24"
                            value={event.template.message}
                            onChange={(e) =>
                              updateNotificationTemplate(event.id, "message", e.target.value)
                            }
                          />
                        </Field>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </AdminSurface>
          ))}

          <div className="flex justify-end">
            <Button onClick={saveNotifications}>
              <Save className="size-4" />
              Save Notification Preferences
            </Button>
          </div>
        </section>
      ) : null}

      <Dialog open={policyEditorOpen} onOpenChange={setPolicyEditorOpen}>
        <DialogContent className="max-h-[88vh] w-[min(94vw,64rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update the public-facing legal content used by the Elite website.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <Input
                value={policyEditorTitle}
                onChange={(event) => setPolicyEditorTitle(event.target.value)}
              />
            </Field>
            <Field label="Last Updated">
              <Input
                value={policyEditorUpdatedAt}
                onChange={(event) => setPolicyEditorUpdatedAt(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
            <Field label="Content">
              <Textarea
                className="min-h-[24rem]"
                value={policyEditorContent}
                onChange={(event) => setPolicyEditorContent(event.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={policyEditorStatus}
                onValueChange={(value) => setPolicyEditorStatus(value as PolicyStatus)}
              >
                <SelectTrigger className="h-12 rounded-xl text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <p className="text-xs leading-6 text-slate-500">
            Keep the first paragraph as the policy introduction, then separate each section heading and
            its body with a blank line.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyEditorOpen(false)}>
              Cancel
            </Button>
            {activePolicyId ? (
              <Button variant="soft" asChild>
                <Link href={policies.find((policy) => policy.id === activePolicyId)?.route ?? "/terms"}>
                  <Eye className="size-4" />
                  Preview
                </Link>
              </Button>
            ) : null}
            <Button onClick={savePolicyEditor}>
              <Save className="size-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-h-[88vh] w-[min(94vw,42rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{faqDialogMode === "create" ? "Add FAQ" : "Edit FAQ"}</DialogTitle>
            <DialogDescription>
              Manage customer-facing answers grouped by service and business category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Question" error={faqErrors.question}>
              <Input
                value={faqForm.question}
                onChange={(event) =>
                  setFaqForm((current) => ({ ...current, question: event.target.value }))
                }
                placeholder="Enter the customer-facing question"
              />
            </Field>

            <Field label="Answer" error={faqErrors.answer}>
              <Textarea
                className="min-h-36"
                value={faqForm.answer}
                onChange={(event) =>
                  setFaqForm((current) => ({ ...current, answer: event.target.value }))
                }
                placeholder="Write a complete, helpful answer"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <Select
                  value={faqForm.category}
                  onValueChange={(value) =>
                    setFaqForm((current) => ({
                      ...current,
                      category: value as FaqCategory,
                    }))
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {faqCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={faqForm.status}
                  onValueChange={(value) =>
                    setFaqForm((current) => ({
                      ...current,
                      status: value as FaqStatus,
                    }))
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFaq}>
              <Save className="size-4" />
              {faqDialogMode === "create" ? "Add FAQ" : "Save FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteFaqId)} onOpenChange={(open) => !open && setDeleteFaqId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ?</DialogTitle>
            <DialogDescription>
              {faqToDelete
                ? `This will permanently remove "${faqToDelete.question}" from the FAQ library.`
                : "This will permanently remove the selected FAQ."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFaqId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteFaq}>
              <Trash2 className="size-4" />
              Delete FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

function Field({ label, children, error }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-primary">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
