export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  rating: number;
  sold: number;
  stock?: number;
  description: string;
  isFlashSale?: boolean;
  bcoin?: number; // Add optional bcoin field
}

export const categories = [
  { id: "notebooks", name: "Notebooks", icon: "📓" },
  { id: "pens", name: "Pens & Pencils", icon: "✏️" },
  { id: "bags", name: "Bags", icon: "🎒" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "art", name: "Art Supplies", icon: "🎨" },
  { id: "tech", name: "Tech & Gadgets", icon: "💻" },
  { id: "uniforms", name: "Uniforms", icon: "👔" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "snacks", name: "Snacks & Drinks", icon: "🍿" },
  { id: "accessories", name: "Accessories", icon: "🎀" },
  { id: "printing", name: "Printing", icon: "🖨️" },
  { id: "hygiene", name: "Hygiene", icon: "🧴" },
  { id: "toys", name: "Toys & Games", icon: "🎲" },
  { id: "org", name: "Org Supplies", icon: "📁" },
];

export const products: Product[] = [
  // Notebooks
  {
    id: "1",
    name: "Premium Spiral Notebook A4",
    price: 45,
    originalPrice: 89,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300",
    images: [
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600",
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600"
    ],
    category: "notebooks",
    rating: 4.8,
    sold: 2340,
    description: "High-quality 200-page spiral notebook with thick paper, perfect for notes and journaling.",
    isFlashSale: true,
    bcoin: 0.5, // BCoins earned per purchase
  },
  {
    id: "n2",
    name: "Yellow Pad Writing Paper (3-pack)",
    price: 60,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=300",
    category: "notebooks",
    rating: 4.6,
    sold: 4100,
    description: "Classic yellow writing pad, 100 sheets each. Great for exams and essays.",
    bcoin: 0.3,
  },
  {
    id: "n3",
    name: "Composition Notebook (5-pack)",
    price: 95,
    originalPrice: 140,
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300",
    category: "notebooks",
    rating: 4.7,
    sold: 3800,
    description: "Standard 80-leaf composition notebooks in assorted colors.",
    bcoin: 0.4,
  },

  // Pens & Pencils
  {
    id: "2",
    name: "Gel Pen Set (12 Colors)",
    price: 35,
    originalPrice: 65,
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300",
    images: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600",
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600"
    ],
    category: "pens",
    rating: 4.9,
    sold: 5600,
    description: "Smooth-writing gel pens in 12 vibrant colors. Great for notes and art.",
    bcoin: 0.6,
  },
  {
    id: "10",
    name: "Highlighter Set (6 Neon)",
    price: 55,
    originalPrice: 95,
    image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300",
    category: "pens",
    rating: 4.7,
    sold: 8900,
    description: "Bright neon highlighters perfect for studying and marking textbooks.",
    bcoin: 0.2,
  },
  {
    id: "14",
    name: "Correction Tape (3-pack)",
    price: 35,
    originalPrice: 55,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300",
    category: "pens",
    rating: 4.8,
    sold: 7800,
    description: "Smooth correction tape for clean, neat corrections.",
    bcoin: 0.1,
  },
  {
    id: "p4",
    name: "Mongol No. 2 Pencil (12pcs)",
    price: 48,
    image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300",
    category: "pens",
    rating: 4.9,
    sold: 15200,
    description: "The iconic Mongol pencil every Filipino student knows and loves.",
    bcoin: 0.2,
  },
  {
    id: "p5",
    name: "Ballpen Blue/Black (10pcs)",
    price: 40,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300",
    category: "pens",
    rating: 4.5,
    sold: 9800,
    description: "Reliable ballpoint pens in blue and black ink. Smooth writing.",
    bcoin: 0.15,
  },
  {
    id: "t4",
    name: "Wired Earphones with Mic",
    price: 89,
    originalPrice: 150,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    category: "tech",
    rating: 4.3,
    sold: 6700,
    description: "Clear sound earphones perfect for online classes and music.",
    bcoin: 0.25,
  },
  {
    id: "t5",
    name: "Portable Phone Stand",
    price: 65,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300",
    category: "tech",
    rating: 4.5,
    sold: 3400,
    description: "Adjustable phone/tablet stand for online learning setups.",
    bcoin: 0.2,
  },

  // Bags
  {
    id: "3",
    name: "Student Backpack - Waterproof",
    price: 299,
    originalPrice: 499,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300",
    category: "bags",
    rating: 4.7,
    sold: 1200,
    description: "Durable waterproof backpack with laptop compartment and multiple pockets.",
    bcoin: 0.8,
  },
  {
    id: "b2",
    name: "Canvas Tote Bag - School Edition",
    price: 149,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300",
    category: "bags",
    rating: 4.4,
    sold: 2300,
    description: "Trendy canvas tote perfect for carrying books and everyday essentials.",
    bcoin: 0.3,
  },
  {
    id: "b3",
    name: "Lunch Bag Insulated",
    price: 120,
    originalPrice: 180,
    image: "https://images.unsplash.com/photo-1622560480605-d83c661a4293?w=300",
    category: "bags",
    rating: 4.6,
    sold: 1800,
    description: "Keep your baon fresh with this insulated lunch bag.",
    bcoin: 0.2,
  },

  // Books  {
    id: "6",
    name: "English-Filipino Dictionary",
    price: 150,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300",
    category: "books",
    rating: 4.5,
    sold: 3400,
    description: "Comprehensive bilingual dictionary for Filipino students.",
    bcoin: 0.4,
  },
  {
    id: "bk2",
    name: "ABM Fundamentals Textbook",
    price: 320,
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300",
    category: "books",
    rating: 4.7,
    sold: 890,
    description: "Essential ABM strand textbook covering accounting and business basics.",
    bcoin: 0.5,
  },
  {
    id: "bk3",
    name: "STEM Review Workbook",
    price: 250,
    originalPrice: 350,
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300",
    category: "books",
    rating: 4.8,
    sold: 1560,
    description: "Practice workbook for STEM students with solved examples.",
    bcoin: 0.4,
  },

  // Art Supplies
  {
    id: "5",
    name: "Watercolor Paint Set (24 Colors)",
    price: 189,
    originalPrice: 320,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300",
    category: "art",
    rating: 4.6,
    sold: 780,
    description: "Professional-grade watercolor paints in a portable palette. 24 vivid colors.",
    bcoin: 0.3,
  },
  {
    id: "11",
    name: "Drawing Sketch Pad A3",
    price: 85,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300",
    category: "art",
    rating: 4.4,
    sold: 1230,
    description: "Thick 50-sheet sketch pad for drawing and illustration projects.",
    bcoin: 0.2,
  },
  {
    id: "a3",
    name: "Colored Pencil Set (36pcs)",
    price: 165,
    originalPrice: 250,
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300",
    category: "art",
    rating: 4.7,
    sold: 2100,
    description: "Vibrant pre-sharpened colored pencils in a tin case.",
    bcoin: 0.25,
  },
  {
    id: "a4",
    name: "Oil Pastel Crayons (24 Colors)",
    price: 95,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
    category: "art",
    rating: 4.5,
    sold: 3200,
    description: "Smooth blendable oil pastels for art class projects.",
    bcoin: 0.2,
  },

  // Tech & Gadgets
  {
    id: "4",
    name: "Scientific Calculator FX-991",
    price: 450,
    originalPrice: 650,
    image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=300",
    category: "tech",
    rating: 4.9,
    sold: 890,
    description: "Advanced scientific calculator for math, physics, and engineering students.",
    bcoin: 0.3,
  },
  {
    id: "8",
    name: "USB Flash Drive 32GB",
    price: 199,
    originalPrice: 350,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300",
    category: "tech",
    rating: 4.7,
    sold: 4500,
    description: "Fast USB 3.0 flash drive. Store all your school files safely.",
    bcoin: 0.2,
  },
  {
    id: "15",
    name: "Laptop Sleeve 14-inch",
    price: 250,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300",
    category: "tech",
    rating: 4.6,
    sold: 2100,
    description: "Padded laptop sleeve with water-resistant exterior.",
    bcoin: 0.2,
  },
  {
    id: "t4",
    name: "Wired Earphones with Mic",
    price: 89,
    originalPrice: 150,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    category: "tech",
    rating: 4.3,
    sold: 6700,
    description: "Clear sound earphones perfect for online classes and music.",
    bcoin: 0.2,
  },
  {
    id: "t5",
    name: "Portable Phone Stand",
    price: 65,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300",
    category: "tech",
    rating: 4.5,
    sold: 3400,
    description: "Adjustable phone/tablet stand for online learning setups.",
    bcoin: 0.15,
  },

  // Uniforms
  {
    id: "7",
    name: "PE Uniform Set",
    price: 350,
    originalPrice: 450,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300",
    category: "uniforms",
    rating: 4.3,
    sold: 670,
    description: "Complete PE uniform set including shirt and shorts.",
    bcoin: 0.1,
  },
  {
    id: "u2",
    name: "School Polo Shirt (White)",
    price: 280,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
    category: "uniforms",
    rating: 4.4,
    sold: 1500,
    description: "Official white polo shirt with school emblem. Comfortable cotton blend.",
    bcoin: 0.1,
  },
  {
    id: "u3",
    name: "School ID Lanyard",
    price: 35,
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300",
    category: "uniforms",
    rating: 4.2,
    sold: 5600,
    description: "Durable lanyard with breakaway clip for school IDs.",
    bcoin: 0.05,
  },

  // Sports
  {
    id: "9",
    name: "Basketball - Official Size",
    price: 299,
    image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=300",
    category: "sports",
    rating: 4.8,
    sold: 560,
    description: "Official size and weight basketball for school games and practice.",
    bcoin: 0.2,
  },
  {
    id: "s2",
    name: "Badminton Racket (Pair)",
    price: 380,
    originalPrice: 500,
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300",
    category: "sports",
    rating: 4.6,
    sold: 890,
    description: "Lightweight racket pair with 3 shuttlecocks included.",
    bcoin: 0.2,
  },
  {
    id: "s3",
    name: "Jump Rope - Speed Rope",
    price: 75,
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=300",
    category: "sports",
    rating: 4.5,
    sold: 2100,
    description: "Adjustable speed jump rope for PE class and fitness.",
    bcoin: 0.1,
  },
  {
    id: "s4",
    name: "Volleyball - Indoor",
    price: 259,
    image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=300",
    category: "sports",
    rating: 4.7,
    sold: 430,
    description: "Official size indoor volleyball for intramural games.",
    bcoin: 0.15,
  },

  // Snacks & Drinks
  {
    id: "12",
    name: "Biscuit Variety Pack",
    price: 120,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300",
    category: "snacks",
    rating: 4.6,
    sold: 12000,
    description: "Assorted biscuits and cookies, perfect for recess snacking.",
    bcoin: 0.1,
  },
  {
    id: "sn2",
    name: "Chocolate Milk Drink (6-pack)",
    price: 90,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
    category: "snacks",
    rating: 4.8,
    sold: 8500,
    description: "Creamy chocolate milk in convenient ready-to-drink packs.",
    bcoin: 0.15,
  },
  {
    id: "sn3",
    name: "Trail Mix Nut Pack",
    price: 65,
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300",
    category: "snacks",
    rating: 4.4,
    sold: 3200,
    description: "Healthy nut and dried fruit mix for energy during study sessions.",
    bcoin: 0.1,
  },
  {
    id: "sn4",
    name: "Instant Noodle Cup (4pcs)",
    price: 80,
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300",
    category: "snacks",
    rating: 4.3,
    sold: 14500,
    description: "Quick and easy cup noodles for busy school days.",
    bcoin: 0.1,
  },

  // Accessories
  {
    id: "13",
    name: "Hair Ribbon Set (10pcs)",
    price: 45,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300",
    category: "accessories",
    rating: 4.5,
    sold: 3400,
    description: "School-approved hair ribbons in various colors.",
    bcoin: 0.05,
  },
  {
    id: "ac2",
    name: "Wristwatch - Digital Student",
    price: 199,
    originalPrice: 350,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300",
    category: "accessories",
    rating: 4.6,
    sold: 1900,
    description: "Water-resistant digital watch with alarm and stopwatch features.",
    bcoin: 0.1,
  },
  {
    id: "ac3",
    name: "Clear Umbrella - Foldable",
    price: 149,
    image: "https://images.unsplash.com/photo-1534309466160-70b22cc6254d?w=300",
    category: "accessories",
    rating: 4.4,
    sold: 2800,
    description: "Compact foldable umbrella for rainy school commutes.",
    bcoin: 0.05,
  },

  // Printing
  {
    id: "pr1",
    name: "Bond Paper A4 (500 sheets)",
    price: 220,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300",
    category: "printing",
    rating: 4.7,
    sold: 6200,
    description: "Bright white 80gsm bond paper for printing and photocopying.",
    bcoin: 0.05,
  },
  {
    id: "pr2",
    name: "Photo Paper Glossy (20 sheets)",
    price: 95,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=300",
    category: "printing",
    rating: 4.5,
    sold: 1400,
    description: "High-gloss photo paper for vivid photo printing.",
    bcoin: 0.05,
  },

  // Hygiene
  {
    id: "hy1",
    name: "Alcohol Spray 70% (150ml)",
    price: 55,
    image: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300",
    category: "hygiene",
    rating: 4.8,
    sold: 11000,
    description: "Pocket-sized isopropyl alcohol spray for on-the-go sanitizing.",
    bcoin: 0.05,
  },
  {
    id: "hy2",
    name: "Tissue Pack (10 packs)",
    price: 45,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300",
    category: "hygiene",
    rating: 4.6,
    sold: 8900,
    description: "Soft pocket tissue packs, a school bag essential.",
    bcoin: 0.05,
  },
  {
    id: "hy3",
    name: "Face Mask (50pcs Box)",
    price: 120,
    originalPrice: 200,
    image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=300",
    category: "hygiene",
    rating: 4.5,
    sold: 5600,
    description: "3-ply disposable face masks for everyday protection.",
    bcoin: 0.05,
  },

  // Toys & Games
  {
    id: "tg1",
    name: "Rubik's Cube 3x3",
    price: 85,
    image: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=300",
    category: "toys",
    rating: 4.7,
    sold: 3200,
    description: "Classic speed cube for brain exercise during breaks.",
    bcoin: 0.1,
  },
  {
    id: "tg2",
    name: "Card Game - UNO",
    price: 120,
    image: "https://images.unsplash.com/photo-1606503153255-59d7ae64e37f?w=300",
    category: "toys",
    rating: 4.9,
    sold: 4500,
    description: "The ultimate recess card game. Fun with friends!",
    bcoin: 0.1,
  },

  // Org Supplies
  {
    id: "o1",
    name: "Clear Book 20 Pockets",
    price: 35,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300",
    category: "org",
    rating: 4.5,
    sold: 5400,
    description: "Organize papers, certificates, and projects neatly.",
    bcoin: 0.05,
  },
  {
    id: "o2",
    name: "Plastic Envelope Long (5pcs)",
    price: 40,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=300",
    category: "org",
    rating: 4.4,
    sold: 7200,
    description: "Snap-button plastic envelopes to keep documents safe.",
    bcoin: 0.05,
  },
  {
    id: "16",
    name: "Math Geometry Set",
    price: 75,
    image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=300",
    category: "org",
    rating: 4.4,
    sold: 3200,
    description: "Complete geometry set with compass, ruler, and set squares.",
    bcoin: 0.1,
  },
];
</function>
</tool_call>
<dyad-write path="src/components/ProductCard.tsx" description="Update ProductCard to display bcoin value">
  <div className="p-3">
    <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>
    <div className="flex items-center gap-1 mb-2">
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span className="text-[10px] text-muted-foreground line-clamp-1">{product.rating}</span>
      <span className="text-xs text-muted-foreground">({product.sold} sold)</span>
    </div>
    {/* NEW: Display BCoins earned per purchase */}
    <p className="text-[10px] text-primary">BCoins: {product.bcoin?.toFixed(1)}</p>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg font-extrabold text-primary">₱{product.price}</span>
      {product.originalPrice && (
        <span className="text-sm text-muted-foreground line-through">₱{product.originalPrice}</span>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={handleAddToCart}
        disabled={!storeOpen}
        className="flex-1 bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-lg hover:bg-secondary/80 disabled:opacity-50"
      >
        <ShoppingCart className="h-3 w-3 inline mr-1" /> Add
      </button>
      <button
        onClick={handleBuyNow}
        disabled={!storeOpen}
        className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/80 disabled:opacity-50"
      >
        Buy Now
      </button>
    </div>
  </div>
</function>