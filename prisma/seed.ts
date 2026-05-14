import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Unique, food-matched Unsplash photo IDs
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

async function main() {
  console.log("🌱 Seeding Kooqs database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be set in .env before seeding");
  }

  const admin = await prisma.admin.create({
    data: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      name: "Kooqs Admin",
      role: "admin",
    },
  });
  console.log("✅ Admin created:", admin.email);

  const [friedRice, jollofRice, noodles, potatoFries, pepperRice, salad, extras, kooqsSpecial] =
    await Promise.all([
      prisma.category.create({ data: { name: "Fried Rice", slug: "fried-rice", icon: "🍚", order: 1, description: "Classic & loaded fried rice options" } }),
      prisma.category.create({ data: { name: "Jollof Rice", slug: "jollof-rice", icon: "🍛", order: 2, description: "Our legendary Ghanaian jollof" } }),
      prisma.category.create({ data: { name: "Noodles", slug: "noodles", icon: "🍜", order: 3, description: "Signature noodle dishes" } }),
      prisma.category.create({ data: { name: "Potato Fries", slug: "potato-fries", icon: "🍟", order: 4, description: "Crispy golden fries" } }),
      prisma.category.create({ data: { name: "Pepper Rice", slug: "pepper-rice", icon: "🌶️", order: 5, description: "Bold & spicy pepper rice" } }),
      prisma.category.create({ data: { name: "Salad", slug: "salad", icon: "🥗", order: 6, description: "Fresh & healthy salads" } }),
      prisma.category.create({ data: { name: "Extras", slug: "extras", icon: "➕", order: 7, description: "Add-ons & extras" } }),
      prisma.category.create({ data: { name: "Kooqs Special", slug: "kooqs-special", icon: "⭐", order: 8, description: "Our signature specialties" } }),
    ]);

  console.log("✅ Categories created");

  // FRIED RICE — each item has a unique, matching image
  await prisma.menuItem.createMany({
    data: [
      { name: "Fried Rice (1 Chicken)", description: "Perfectly seasoned fried rice served with one piece of succulent chicken", price: 35, categoryId: friedRice.id, available: true, featured: false, image: U("1603133872878-684f208fb84b") },
      { name: "Fried Rice (2 Chicken)", description: "Perfectly seasoned fried rice served with two generous pieces of chicken", price: 60, categoryId: friedRice.id, available: true, featured: true, image: U("1512058564366-18510be2db19") },
      { name: "Fried Rice & Egg/Sausage", description: "Classic fried rice paired with egg and sausage — a satisfying combo", price: 35, categoryId: friedRice.id, available: true, featured: false, image: U("1603360946369-dc9bb6258143") },
      { name: "Fried Rice & Chicken & Plantain", description: "Fried rice with chicken and sweet fried plantain for the perfect trio", price: 70, categoryId: friedRice.id, available: true, featured: true, image: U("1547592166-23ac45744acd") },
      { name: "Fried Rice & Spicy Wings", description: "Fried rice with our crispy spicy wings — a fan favourite", price: 70, categoryId: friedRice.id, available: true, featured: false, spicy: true, image: U("1527477396000-e27163b481c2") },
      { name: "Beef Fried Rice", description: "Fried rice loaded with tender seasoned beef chunks", price: 70, categoryId: friedRice.id, available: true, featured: false, image: U("1558030006-450675393462") },
      { name: "Assorted Fried Rice", description: "Fried rice with a generous mix of chicken, beef, and proteins", price: 75, categoryId: friedRice.id, available: true, featured: false, image: U("1564671165093-20688ff1fffa") },
      { name: "Seafood Fried Rice", description: "Premium fried rice packed with shrimp, calamari, and fresh seafood", price: 100, categoryId: friedRice.id, available: true, featured: true, image: U("1559847844-5315695dadae") },
    ],
  });

  // JOLLOF RICE — tomato-red base, each image unique
  await prisma.menuItem.createMany({
    data: [
      { name: "Jollof (1 Chicken)", description: "Ghana's finest jollof rice served with one piece of chicken", price: 45, categoryId: jollofRice.id, available: true, featured: false, image: U("1567620905732-2d1ec7ab7445") },
      { name: "Jollof (2 Chicken)", description: "Ghana's finest jollof rice served with two generous pieces of chicken", price: 70, categoryId: jollofRice.id, available: true, featured: true, image: U("1547592180-85f173990554") },
      { name: "Beef Jollof", description: "Rich smoky jollof rice with tender seasoned beef", price: 70, categoryId: jollofRice.id, available: true, featured: false, image: U("1574484284002-952d92456975") },
      { name: "Assorted Jollof", description: "Jollof rice loaded with a mix of chicken, beef, and proteins", price: 75, categoryId: jollofRice.id, available: true, featured: false, image: U("1504674900247-0877df9cc836") },
      { name: "Jollof & Chicken & Plantain", description: "Classic jollof with chicken and sweet fried plantain — the ultimate combo", price: 70, categoryId: jollofRice.id, available: true, featured: true, image: U("1530469912745-a215c6b256ea") },
      { name: "Jollof & Spicy Wings", description: "Smoky jollof rice paired with our signature spicy wings", price: 70, categoryId: jollofRice.id, available: true, featured: false, spicy: true, image: U("1562967914-608f82629710") },
      { name: "Jollof & Goat", description: "Aromatic jollof rice with slow-cooked spiced goat meat", price: 70, categoryId: jollofRice.id, available: true, featured: false, image: U("1588166524941-3bf61a9c41db") },
      { name: "Jollof & Goat & Plantain", description: "The royal plate — jollof, goat meat, and sweet fried plantain", price: 80, categoryId: jollofRice.id, available: true, featured: false, image: U("1572802419224-296b0aeee0d9") },
    ],
  });

  // NOODLES
  await prisma.menuItem.createMany({
    data: [
      { name: "Noodles — Regular", description: "Simple, well-seasoned noodles — light and satisfying", price: 30, categoryId: noodles.id, available: true, featured: false, image: U("1569718212165-3a8278d5f624") },
      { name: "Noodles — Signature", description: "Our signature noodles with special Kooqs seasoning and toppings", price: 50, categoryId: noodles.id, available: true, featured: true, image: U("1563379926898-05f4575a45d8") },
      { name: "Noodles — Chicken", description: "Noodles topped with tender seasoned chicken pieces", price: 60, categoryId: noodles.id, available: true, featured: false, image: U("1555126634-323283e090fa") },
      { name: "Noodles — Fully Loaded", description: "Noodles loaded with chicken, beef, vegetables, and eggs — the works", price: 75, categoryId: noodles.id, available: true, featured: false, image: U("1612929633738-8fe44f7ec841") },
      { name: "Kooqs Special Noodles", description: "A secret recipe noodle dish — the Kooqs twist you didn't know you needed", price: 50, categoryId: noodles.id, available: true, featured: true, image: U("1552611052-33e04de081de") },
    ],
  });

  // POTATO FRIES
  await prisma.menuItem.createMany({
    data: [
      { name: "Potato Fries — Regular", description: "Golden crispy potato fries seasoned to perfection with dipping sauce", price: 60, categoryId: potatoFries.id, available: true, featured: false, image: U("1573080496219-bb080dd4f877") },
      { name: "Kooqs Special Fries", description: "Our loaded fries — topped with special sauce, chicken, and seasonings", price: 100, categoryId: potatoFries.id, available: true, featured: true, image: U("1568901346375-23c9450c58cd") },
    ],
  });

  // PEPPER RICE — spicy red rice dishes
  await prisma.menuItem.createMany({
    data: [
      { name: "Pepper Rice — Spicy Goat", description: "Bold spiced pepper rice served with aromatic slow-cooked goat meat", price: 80, categoryId: pepperRice.id, available: true, featured: true, spicy: true, image: U("1604908177522-5c2f3a3ab04f") },
      { name: "Pepper Rice — Spicy Wings", description: "Fiery pepper rice paired with our crispy spicy chicken wings", price: 70, categoryId: pepperRice.id, available: true, featured: false, spicy: true, image: U("1598103442097-8b74394b95c1") },
    ],
  });

  // SALAD
  await prisma.menuItem.createMany({
    data: [
      { name: "Egg Salad", description: "Fresh mixed salad topped with boiled eggs and light dressing", price: 50, categoryId: salad.id, available: true, featured: false, vegetarian: true, image: U("1512621776951-a57141f2eefd") },
      { name: "Chicken Salad", description: "Crisp salad loaded with grilled chicken, veggies, and creamy dressing", price: 60, categoryId: salad.id, available: true, featured: false, image: U("1540420773420-3366772f4999") },
      { name: "Loaded Salad", description: "The full experience — chicken, egg, avocado, tomatoes, and premium dressing", price: 80, categoryId: salad.id, available: true, featured: true, image: U("1546069901-ba9599a7e63c") },
    ],
  });

  // EXTRAS
  await prisma.menuItem.createMany({
    data: [
      { name: "Abele Wails", description: "A classic Ghanaian side addition to complement your main dish", price: 5, categoryId: extras.id, available: true, featured: false, image: U("1567306226416-28f0efdc88ce") },
      { name: "Extra Chicken", description: "Add an extra piece of our well-seasoned chicken to any order", price: 20, categoryId: extras.id, available: true, featured: false, image: U("1587593810167-a84920ea0781") },
    ],
  });

  // KOOQS SPECIAL — Banku & Tilapia with grilled fish image
  await prisma.menuItem.createMany({
    data: [
      { name: "Banku & Tilapia", description: "Authentic Ghanaian banku (fermented corn & cassava dough) with grilled tilapia, shito, and salad — a true classic", price: 70, categoryId: kooqsSpecial.id, available: true, featured: true, image: U("1559363126-1021e2851c7b") },
    ],
  });

  const totalItems = await prisma.menuItem.count();
  console.log(`✅ ${totalItems} menu items created with matched images`);
  console.log("\n🚀 Kooqs database seeded successfully!");
  console.log(`📧 Admin login: ${adminEmail}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
