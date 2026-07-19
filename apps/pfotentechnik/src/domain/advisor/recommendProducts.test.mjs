import assert from "node:assert/strict";
import { recommendAdvisorProducts } from "./recommendProducts.ts";

const products = [
  {
    id: "microchip",
    slug: "microchip",
    title: "Microchip Feeder",
    description: "",
    recommendation: "Für mehrere Katzen",
    rating: 4.6,
    bestFor: ["Mehrkatzenhaushalt"],
    attention: [],
    strengths: ["Mikrochip"],
    weaknesses: [],
    features: ["Mikrochip"],
    foodType: ["dry", "wet"],
    access: "microchip",
    priceCategory: "premium",
    route: "/produkt/microchip/"
  },
  {
    id: "camera",
    slug: "camera",
    title: "Camera Feeder",
    description: "",
    recommendation: "Für Katzen mit Kamera",
    rating: 4.5,
    bestFor: ["Katze"],
    attention: [],
    strengths: ["Kamera", "App"],
    weaknesses: [],
    features: ["Kamera", "App"],
    foodType: ["dry"],
    camera: true,
    app: true,
    priceCategory: "midrange",
    route: "/produkt/camera/"
  }
];

const multiPet = recommendAdvisorProducts(products, {
  pet: "cat",
  petCount: "multiple",
  food: "mixed",
  budget: "open",
  priorities: ["microchip"],
  decisionStyle: "safe-choice"
});

assert.equal(multiPet[0].product.id, "microchip");

const camera = recommendAdvisorProducts(products, {
  pet: "cat",
  petCount: "one",
  food: "dry",
  budget: "midrange",
  priorities: ["camera", "app"],
  decisionStyle: "best-match"
});

assert.equal(camera[0].product.id, "camera");

console.log("Advisor 2.0 recommendation tests passed.");
