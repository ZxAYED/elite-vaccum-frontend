import {
  Award,
  CircleUser,
  Shield,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import Image from "next/image";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";

const stats = [
  { value: "4.9/5", label: "Avg. Rating", icon: Star },
  { value: "8,200", label: "Active Clients", icon: CircleUser },
];

const team = [
  {
    name: "Jerome Bell",
    role: "Founder & CEO",
    img: "/landing/about/team/jerome.png",
  },
  {
    name: "Kristin Watson",
    role: "Head of Operations",
    img: "/landing/about/team/kristin.png",
  },
  {
    name: "Esther Howard",
    role: "Technical Lead",
    img: "/landing/about/team/esther.png",
  },
  {
    name: "Jacob Jones",
    role: "Chief Service Officer",
    img: "/landing/about/team/jacob.png",
  },
];

const badges = [
  { icon: Shield, index: 1, text: "VDMA Certified" },
  { icon: ShieldCheck, index: 2, text: "Home Guard Gold" },
  { icon: UsersRound, index: 3, text: "10k+ Members" },
  { icon: Award, index: 4, text: "Elite Guarantee" },
];

export default function EliteSection() {
  return (
    <section className="space-y-24 bg-[#F9F9F9]">
      {/* Stats */}
      <div className="text-center space-y-10 py-12 px-8 md:px-0">
        <FadeIn>
          <h2 className="text-3xl font-semibold text-emerald-900">
            Elite by the numbers
          </h2>
          <p className="text-sm text-muted-foreground">
            Verified data from our service management dashboard.
          </p>
        </FadeIn>

        <StaggerGroup className="grid md:grid-cols-2 gap-8 mt-16 lg:mt-20 max-w-360 mx-auto" delay={0.06}>
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <StaggerItem key={item.label}>
                <div className="rounded-sm bg-white p-6 shadow-sm border text-left">
                  <div className="flex flex-col items-left   gap-4 mb-6">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="text-primary" size={28} />
                    </div>
                  </div>
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-sm text-[#475569]">{item.label}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>

      {/* Leadership */}
      <div className="text-center space-y-10">
        <FadeIn>
          <h3 className="text-3xl font-semibold text-emerald-900">
            The Leadership Team
          </h3>
          <p className="text-sm text-muted-foreground">
            The experts driving the elite experience.
          </p>
        </FadeIn>

        <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-360 mx-auto px-4" delay={0.06}>
          {team.map((member) => (
            <StaggerItem key={member.name}>
              <div className="bg-white border rounded-xl p-4 md:p-6 text-center shadow-sm">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Image
                    src={member.img}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>

      {/* Trust badges */}
      <div className="bg-muted py-10 px-8 md:px-0">
        <StaggerGroup className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-4 gap-6" delay={0.06}>
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <StaggerItem key={badge.text}>
                <div className="bg-white flex items-center justify-around md:justify-center gap-4 rounded-lg  py-4 md:py-6 text-center shadow-sm text-xl font-medium">
                  <div className="bg-[#E8EDEE] p-2 rounded-md">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  {badge.text}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
