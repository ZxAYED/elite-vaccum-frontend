import type { StaticImageData } from "next/image";

import colileAdapter from "@/public/landing/service/products/cable.jpg";
import carpetVacuum from "@/public/landing/service/products/canister.jpg";
import cordlessVacuum from "@/public/landing/service/products/cordless.jpg";
import scrubRoller from "@/public/landing/service/products/screw.jpg";
import vacuumBag from "@/public/landing/service/products/vacume-bag.png";
import vacuumHandTool from "@/public/landing/service/products/vacume.jpg";
import mopBrush from "@/public/landing/service/products/water-mop.jpg";

export const mockProductImagesById: Record<string, StaticImageData> = {
  "prd-hand-tool": vacuumHandTool,
  "prd-canister": carpetVacuum,
  "prd-cordless": cordlessVacuum,
  "prd-adapter": colileAdapter,
  "prd-brush-head": mopBrush,
  "prd-pipe": vacuumHandTool,
  "prd-roller": scrubRoller,
  "prd-bag": vacuumBag,
};
