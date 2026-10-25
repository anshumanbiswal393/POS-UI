import type {
  SpecialNote,
  MenuCategory,
  MenuItemCommission,
  MenuItem,
  MenuItemImage,
  PhysicalMenuRecord,
  MenuScheduleItem,
  VirtualOutlet,
  ScheduleMenuItem,
  ScheduleCategoryItem,
  ScheduleVariantItem,
  ScheduleTableItem,
} from "@/types/posMenu";
import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { isBackendOutletId } from "@/utils/outletId";

const SAMPLE_IMAGES: Record<string, MenuItemImage[]> = {
  butter_chicken: [
    {
      id: "img-bc-1",
      url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
      name: "butter_chicken_plate.jpg",
      isPrimary: true,
      size: "1.2 MB",
      type: "image/jpeg",
      uploadedAt: "Today, 10:30 AM",
    },
    {
      id: "img-bc-2",
      url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80",
      name: "butter_chicken_curry_bowl.jpg",
      isPrimary: false,
      size: "940 KB",
      type: "image/jpeg",
      uploadedAt: "Yesterday",
    },
  ],
  paneer_tikka: [
    {
      id: "img-pt-1",
      url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80",
      name: "paneer_tikka_skewers.jpg",
      isPrimary: true,
      size: "820 KB",
      type: "image/jpeg",
      uploadedAt: "Today, 09:15 AM",
    },
  ],
  dal_makhani: [
    {
      id: "img-dm-1",
      url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80",
      name: "dal_makhani_handi.jpg",
      isPrimary: true,
      size: "1.1 MB",
      type: "image/jpeg",
      uploadedAt: "3 days ago",
    },
  ],
  biryani: [
    {
      id: "img-by-1",
      url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
      name: "dum_biryani_pot.jpg",
      isPrimary: true,
      size: "1.4 MB",
      type: "image/jpeg",
      uploadedAt: "2 days ago",
    },
    {
      id: "img-by-2",
      url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80",
      name: "biryani_serving_dish.jpg",
      isPrimary: false,
      size: "880 KB",
      type: "image/jpeg",
      uploadedAt: "3 days ago",
    },
  ],
  burger: [
    {
      id: "img-bg-1",
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      name: "smash_burger_deluxe.jpg",
      isPrimary: true,
      size: "1.3 MB",
      type: "image/jpeg",
      uploadedAt: "Yesterday",
    },
  ],
  mojito: [
    {
      id: "img-mj-1",
      url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
      name: "mint_virgin_mojito.jpg",
      isPrimary: true,
      size: "650 KB",
      type: "image/jpeg",
      uploadedAt: "4 days ago",
    },
  ],
};

const initialMenuItems: MenuItem[] = [
  // Primary Outlet (Highway Inn Main) - Core Billing & POS Menu
  {
    id: "itm-101",
    outletId: "outlet-primary",
    code: "#101",
    name: "Paneer Tikka Angara",
    onlineDisplayName: "Paneer Tikka Angara Charcoal Smoked",
    category: "Starters",
    itemType: "Veg",
    price: 340,
    taxRate: 5,
    status: "Active",
    description: "Charcoal smoked cottage cheese marinated in fiery spices & hung curd",
    variants: [
      { id: "v1-half", name: "Half", price: 220 },
      { id: "v1-full", name: "Full", price: 340 },
    ],
    images: [
      {
        id: "img-pt-101",
        url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=80",
        name: "paneer_tikka_angara.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-102",
    outletId: "outlet-primary",
    code: "#102",
    name: "Murgh Malai Tikka",
    onlineDisplayName: "Murgh Malai Tikka Tender Cream",
    category: "Starters",
    itemType: "Non-Veg",
    price: 420,
    taxRate: 5,
    status: "Active",
    description: "Tender chicken chunks marinated in cream, cardamom, cashew paste & grilled",
    variants: [
      { id: "v2-half", name: "Half", price: 260 },
      { id: "v2-full", name: "Full", price: 420 },
    ],
    images: [
      {
        id: "img-mm-102",
        url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80",
        name: "murgh_malai_tikka.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-103",
    outletId: "outlet-primary",
    code: "#103",
    name: "Crispy Corn & Water Chestnut",
    onlineDisplayName: "Golden Crispy Corn & Water Chestnut",
    category: "Starters",
    itemType: "Veg",
    price: 290,
    taxRate: 5,
    status: "Active",
    description: "Golden fried sweet corn kernels tossed with crushed pepper, scallions and lime",
    images: [
      {
        id: "img-cc-103",
        url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
        name: "crispy_corn.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-104",
    outletId: "outlet-primary",
    code: "#104",
    name: "Galouti Kebab Sliders",
    onlineDisplayName: "Awadhi Galouti Kebab Sliders",
    category: "Starters",
    itemType: "Non-Veg",
    price: 460,
    taxRate: 5,
    status: "Active",
    description: "Melt in mouth minced mutton kebabs served over mini saffron sheermal buns",
    images: [
      {
        id: "img-gk-104",
        url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
        name: "galouti_kebab.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-105",
    outletId: "outlet-primary",
    code: "#105",
    name: "Butter Chicken (Grandma Recipe)",
    onlineDisplayName: "Smoked Butter Chicken (Grandma Recipe)",
    category: "Main Course",
    itemType: "Non-Veg",
    price: 520,
    taxRate: 5,
    status: "Active",
    description: "Smoked tandoori chicken cooked in velvety tomato, makhani gravy and cashew paste",
    variants: [
      { id: "v3-boneless", name: "Boneless", price: 560 },
      { id: "v3-classic", name: "Classic", price: 520 },
    ],
    images: [
      {
        id: "img-bc-105",
        url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80",
        name: "butter_chicken.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-106",
    outletId: "outlet-primary",
    code: "#106",
    name: "Dal Makhani 24-Hour Slow Cooked",
    onlineDisplayName: "Dal Makhani 24-Hour Slow Cooked Handi",
    category: "Main Course",
    itemType: "Veg",
    price: 360,
    taxRate: 5,
    status: "Active",
    description: "Black lentils simmered overnight with cream, butter and sun-dried fenugreek",
    images: [
      {
        id: "img-dm-106",
        url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
        name: "dal_makhani.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-107",
    outletId: "outlet-primary",
    code: "#107",
    name: "Paneer Lababdar",
    onlineDisplayName: "Shahi Paneer Lababdar Gravy",
    category: "Main Course",
    itemType: "Veg",
    price: 410,
    taxRate: 5,
    status: "Active",
    description: "Cottage cheese cubes bathed in rich onion tomato gravy with grated paneer",
    images: [
      {
        id: "img-pl-107",
        url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
        name: "paneer_lababdar.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-108",
    outletId: "outlet-primary",
    code: "#108",
    name: "Mutton Rogan Josh Kashmiri",
    onlineDisplayName: "Mutton Rogan Josh Kashmiri Handi",
    category: "Main Course",
    itemType: "Non-Veg",
    price: 640,
    taxRate: 5,
    status: "Active",
    description: "Slow-braised spring lamb shanks flavored with aromatic Kashmiri chillies and ratan jot",
    images: [
      {
        id: "img-rj-108",
        url: "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80",
        name: "rogan_josh.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-109",
    outletId: "outlet-primary",
    code: "#109",
    name: "Garlic Butter Naan",
    onlineDisplayName: "Garlic Butter Naan Clay Oven",
    category: "Breads & Rice",
    itemType: "Veg",
    price: 95,
    taxRate: 5,
    status: "Active",
    description: "Refined flour flatbread brushed with garlic butter and fresh coriander",
    images: [
      {
        id: "img-gn-109",
        url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
        name: "garlic_naan.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-110",
    outletId: "outlet-primary",
    code: "#110",
    name: "Laccha Paratha",
    onlineDisplayName: "Crispy Layered Laccha Paratha",
    category: "Breads & Rice",
    itemType: "Veg",
    price: 85,
    taxRate: 5,
    status: "Active",
    images: [
      {
        id: "img-lp-110",
        url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=80",
        name: "laccha_paratha.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-111",
    outletId: "outlet-primary",
    code: "#111",
    name: "Dum Awadhi Gosht Biryani",
    onlineDisplayName: "Dum Awadhi Gosht Biryani Handi",
    category: "Breads & Rice",
    itemType: "Non-Veg",
    price: 580,
    taxRate: 5,
    status: "Active",
    description: "Long grain basmati sealed in dough pot with tender lamb cuts, saffron & spices",
    images: [
      {
        id: "img-gb-111",
        url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
        name: "gosht_biryani.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-112",
    outletId: "outlet-primary",
    code: "#112",
    name: "Subz Dum Biryani Handi",
    onlineDisplayName: "Garden Subz Dum Biryani Handi",
    category: "Breads & Rice",
    itemType: "Veg",
    price: 390,
    taxRate: 5,
    status: "Active",
    images: [
      {
        id: "img-sb-112",
        url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80",
        name: "subz_biryani.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-113",
    outletId: "outlet-primary",
    code: "#113",
    name: "Truffle Mushroom Risotto",
    onlineDisplayName: "Wild Truffle Mushroom Risotto",
    category: "Continental & Pasta",
    itemType: "Veg",
    price: 490,
    taxRate: 5,
    status: "Active",
    description: "Arborio rice with wild forest mushrooms, parmesan crisp and white truffle oil",
    images: [
      {
        id: "img-tr-113",
        url: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=500&auto=format&fit=crop&q=80",
        name: "truffle_risotto.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-114",
    outletId: "outlet-primary",
    code: "#114",
    name: "Penne Alfredo with Smoked Chicken",
    onlineDisplayName: "Creamy Penne Alfredo with Smoked Chicken",
    category: "Continental & Pasta",
    itemType: "Non-Veg",
    price: 470,
    taxRate: 5,
    status: "Active",
    images: [
      {
        id: "img-pa-114",
        url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=500&auto=format&fit=crop&q=80",
        name: "penne_alfredo.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-115",
    outletId: "outlet-primary",
    code: "#115",
    name: "Shahi Tukda with Saffron Rabri",
    onlineDisplayName: "Royal Shahi Tukda Saffron Rabri",
    category: "Desserts",
    itemType: "Veg",
    price: 210,
    taxRate: 5,
    status: "Active",
    images: [
      {
        id: "img-st-115",
        url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
        name: "shahi_tukda.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-116",
    outletId: "outlet-primary",
    code: "#116",
    name: "Sizzling Chocolate Walnut Brownie",
    onlineDisplayName: "Sizzling Chocolate Walnut Brownie with Ice Cream",
    category: "Desserts",
    itemType: "Veg",
    price: 280,
    taxRate: 5,
    status: "Active",
    images: [
      {
        id: "img-br-116",
        url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
        name: "brownie.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-117",
    outletId: "outlet-primary",
    code: "#117",
    name: "Fresh Lime Soda (Sweet & Salt)",
    onlineDisplayName: "Chilled Fresh Lime Soda",
    category: "Beverages & Shakes",
    itemType: "Veg",
    price: 140,
    taxRate: 12,
    status: "Active",
    images: [
      {
        id: "img-ls-117",
        url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
        name: "lime_soda.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-118",
    outletId: "outlet-primary",
    code: "#118",
    name: "Signature Berry Mojito",
    onlineDisplayName: "Signature Berry Mojito Sparkler",
    category: "Beverages & Shakes",
    itemType: "Veg",
    price: 220,
    taxRate: 12,
    status: "Active",
    images: [
      {
        id: "img-bm-118",
        url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
        name: "berry_mojito.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-119",
    outletId: "outlet-primary",
    code: "#119",
    name: "Cold Brew Iced Coffee Shake",
    onlineDisplayName: "Cold Brew Iced Coffee Shake",
    category: "Beverages & Shakes",
    itemType: "Veg",
    price: 240,
    taxRate: 12,
    status: "Active",
    images: [
      {
        id: "img-cb-119",
        url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80",
        name: "cold_brew.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-120",
    outletId: "outlet-primary",
    code: "#120",
    name: "Smoked Old Fashioned Cocktail",
    onlineDisplayName: "Craft Smoked Old Fashioned",
    category: "Bar & Cocktails",
    itemType: "Veg",
    price: 540,
    taxRate: 18,
    status: "Active",
    images: [
      {
        id: "img-of-120",
        url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=80",
        name: "old_fashioned.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: false,
    swiggy: false,
    direct: false,
    updatedAt: "Just now",
  },
  {
    id: "itm-121",
    outletId: "outlet-primary",
    code: "#121",
    name: "Bira 91 White Draught Pint",
    onlineDisplayName: "Bira 91 White Wheat Beer Pint (330ml)",
    category: "Bar & Cocktails",
    itemType: "Veg",
    price: 290,
    taxRate: 18,
    status: "Active",
    images: [
      {
        id: "img-bw-121",
        url: "https://images.unsplash.com/photo-1608270119853-90d510667e6c?w=500&auto=format&fit=crop&q=80",
        name: "bira_pint.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: false,
    swiggy: false,
    direct: false,
    updatedAt: "Just now",
  },
  {
    id: "itm-122",
    outletId: "outlet-primary",
    code: "#122",
    name: "Royal Non-Veg Platter Combo",
    onlineDisplayName: "Royal Non-Veg Tandoori Kebab Platter Combo",
    category: "Combos",
    itemType: "Non-Veg",
    price: 790,
    taxRate: 5,
    status: "Active",
    description: "Assorted tandoori murgh, mutton seekh, fish tikka and butter naan",
    images: [
      {
        id: "img-pl-122",
        url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80",
        name: "royal_platter.jpg",
        isPrimary: true,
      },
    ],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  // Legacy Outlet items
  {
    id: "itm-1",
    outletId: "outlet-primary",
    code: "FD-104",
    name: "Butter Chicken Boneless Gravy",
    onlineDisplayName: "Rich Butter Chicken Boneless Gravy (500g)",
    category: "Non-Veg Main Course",
    itemType: "Non-Veg",
    price: 380,
    taxRate: 5,
    status: "Active",
    description:
      "Tender boneless chicken roasted in tandoor and simmered in a silky tomato, cashew and butter gravy.",
    images: SAMPLE_IMAGES.butter_chicken,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "10 mins ago",
  },
  {
    id: "itm-2",
    outletId: "outlet-primary",
    code: "FD-201",
    name: "Paneer Butter Masala",
    onlineDisplayName: "Paneer Butter Masala Classic",
    category: "Veg Main Course",
    itemType: "Veg",
    price: 280,
    taxRate: 5,
    status: "Active",
    description:
      "Cottage cheese cubes tossed in rich tomato-cream sauce with fenugreek and butter.",
    images: SAMPLE_IMAGES.paneer_tikka,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "1 hour ago",
  },
  {
    id: "itm-3",
    outletId: "outlet-primary",
    code: "FD-202",
    name: "Dal Makhani Handi",
    onlineDisplayName: "Slow Cooked Dal Makhani Handi",
    category: "Veg Main Course",
    itemType: "Veg",
    price: 240,
    taxRate: 5,
    status: "Active",
    description:
      "Black lentils slow-cooked overnight with churned butter and fresh cream in a clay handi.",
    images: SAMPLE_IMAGES.dal_makhani,
    baseMenu: true,
    zomato: true,
    swiggy: false,
    direct: true,
    updatedAt: "Yesterday",
  },
  {
    id: "itm-4",
    outletId: "outlet-primary",
    code: "FD-108",
    name: "Tandoori Murgh (Full)",
    onlineDisplayName: "Authentic Charcoal Tandoori Chicken",
    category: "Non-Veg Starters",
    itemType: "Non-Veg",
    price: 460,
    taxRate: 5,
    status: "Active",
    description:
      "Whole chicken marinated with Kashmiri chili, yogurt, roasted spices, and char-grilled in tandoor.",
    images: SAMPLE_IMAGES.butter_chicken,
    baseMenu: true,
    zomato: false,
    swiggy: false,
    direct: true,
    nextAvailableTime: "Tomorrow 11:00 AM",
    updatedAt: "2 hours ago",
  },
  {
    id: "itm-5",
    outletId: "outlet-primary",
    code: "FD-203",
    name: "Paneer Tikka Charcoal Grilled",
    onlineDisplayName: "Paneer Tikka Charcoal Grilled (8 Pcs)",
    category: "Veg Starters",
    itemType: "Veg",
    price: 260,
    taxRate: 5,
    status: "Active",
    description:
      "Fresh cottage cheese skewers marinated in mustard oil, ajwain and hung curd with capsicum and onion.",
    images: SAMPLE_IMAGES.paneer_tikka,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-6",
    outletId: "outlet-primary",
    code: "FD-301",
    name: "Butter Naan",
    onlineDisplayName: "Tandoori Butter Naan",
    category: "Bread",
    itemType: "Veg",
    price: 60,
    taxRate: 5,
    status: "Active",
    description:
      "Crispy and soft refined flour bread baked in clay oven and generously brushed with melted butter.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Today",
  },
  {
    id: "itm-7",
    outletId: "outlet-primary",
    code: "FD-302",
    name: "Garlic Butter Naan",
    onlineDisplayName: "Clay Baked Garlic Butter Naan",
    category: "Bread",
    itemType: "Veg",
    price: 75,
    taxRate: 5,
    status: "Active",
    description:
      "Hand-stretched leavened flatbread topped with minced garlic, fresh coriander and butter.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Today",
  },
  {
    id: "itm-8",
    outletId: "outlet-primary",
    code: "FD-102",
    name: "Egg Curry Masala (2 Eggs)",
    onlineDisplayName: "Dhabha Style Egg Curry with Steamed Rice",
    category: "Egg Specialties",
    itemType: "Egg",
    price: 210,
    taxRate: 5,
    status: "Active",
    description:
      "Boiled eggs fried golden and simmered in a robust onion-tomato and whole spice gravy.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "2 days ago",
  },
  {
    id: "itm-9",
    outletId: "outlet-primary",
    code: "BEV-001",
    name: "Magic Moments Jamun 180 Ml",
    onlineDisplayName: "Magic Moments Jamun (180ml)",
    category: "Vodka",
    itemType: "Veg",
    price: 260,
    taxRate: 18,
    status: "Active",
    description: "Smooth grain vodka infused with Indian black plum flavors.",
    images: [],
    baseMenu: true,
    zomato: false,
    swiggy: false,
    direct: false,
    updatedAt: "3 days ago",
  },
  {
    id: "itm-10",
    outletId: "outlet-primary",
    code: "BEV-004",
    name: "Royal Green 375 Ml",
    onlineDisplayName: "Royal Green Select Whisky 375ml",
    category: "Indian Whisky",
    itemType: "Veg",
    price: 530,
    taxRate: 18,
    status: "Active",
    description: "Fine blended malt whisky with smoky notes.",
    images: [],
    baseMenu: true,
    zomato: false,
    swiggy: false,
    direct: false,
    updatedAt: "4 days ago",
  },
  {
    id: "itm-11",
    outletId: "outlet-primary",
    code: "BEV-102",
    name: "Classic Virgin Mojito",
    onlineDisplayName: "Mint Lime Virgin Mojito (300ml)",
    category: "Mocktails",
    itemType: "Veg",
    price: 160,
    taxRate: 12,
    status: "Active",
    description:
      "Refreshing cooler with muddled fresh mint leaves, lemon juice, sugar cane syrup, and sparkling soda.",
    images: SAMPLE_IMAGES.mojito,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Yesterday",
  },
  {
    id: "itm-12",
    outletId: "outlet-primary",
    code: "FD-401",
    name: "Veg Manchow Soup",
    onlineDisplayName: "Spicy Veg Manchow Soup with Crispy Noodles",
    category: "Veg Soup",
    itemType: "Veg",
    price: 140,
    taxRate: 5,
    status: "Active",
    description:
      "Dark spicy broth loaded with garlic, ginger, chopped vegetables and topped with crispy fried noodles.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "3 days ago",
  },
  {
    id: "itm-13",
    outletId: "outlet-primary",
    code: "FD-402",
    name: "Chicken Manchow Soup",
    onlineDisplayName: "Chicken Manchow Soup Hot & Spicy",
    category: "Non-Veg Soup",
    itemType: "Non-Veg",
    price: 160,
    taxRate: 5,
    status: "Active",
    description:
      "Savory chicken broth with shredded chicken, egg drops, chili garlic and fried noodles.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "3 days ago",
  },
  {
    id: "itm-14",
    outletId: "outlet-primary",
    code: "FD-501",
    name: "Gulab Jamun with Rabri",
    onlineDisplayName: "Hot Gulab Jamun (2 Pcs) with Chilled Shahi Rabri",
    category: "Desserts",
    itemType: "Veg",
    price: 150,
    taxRate: 5,
    status: "Active",
    description:
      "Warm mawa dumplings soaked in cardamom sugar syrup served with thick saffron rabri.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Yesterday",
  },

  // Virtual Outlet 1: Highway Inn - Cloud Kitchen (BIRYANI EXPRESS)
  {
    id: "itm-be-1",
    outletId: "vo-1",
    code: "BE-101",
    name: "Hyderabadi Chicken Dum Biryani",
    onlineDisplayName: "Hyderabadi Chicken Dum Biryani (Serves 1-2 with Raita & Salan)",
    category: "Biryani & Rice",
    itemType: "Non-Veg",
    price: 340,
    taxRate: 5,
    status: "Active",
    description:
      "Long grain Basmati rice dum-cooked with tender marinated chicken, saffron, brown onions and fresh mint.",
    images: SAMPLE_IMAGES.biryani,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Just now",
  },
  {
    id: "itm-be-2",
    outletId: "vo-1",
    code: "BE-102",
    name: "Mutton Dum Biryani Special",
    onlineDisplayName: "Royal Awadhi Mutton Dum Biryani (Pot Serves 2)",
    category: "Biryani & Rice",
    itemType: "Non-Veg",
    price: 490,
    taxRate: 5,
    status: "Active",
    description:
      "Succulent spring mutton pieces cooked in aromatic spices and slow dum with aged basmati rice.",
    images: SAMPLE_IMAGES.biryani,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "10 mins ago",
  },
  {
    id: "itm-be-3",
    outletId: "vo-1",
    code: "BE-103",
    name: "Paneer Subz Dum Biryani",
    onlineDisplayName: "Paneer & Garden Veggie Dum Biryani Handi",
    category: "Biryani & Rice",
    itemType: "Veg",
    price: 290,
    taxRate: 5,
    status: "Active",
    description:
      "Fresh malai paneer, seasonal vegetables and aromatic basmati rice layered with herbs and saffron.",
    images: SAMPLE_IMAGES.biryani,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Yesterday",
  },
  {
    id: "itm-be-4",
    outletId: "vo-1",
    code: "BE-201",
    name: "Murgh Malai Tikka (6 Pcs)",
    onlineDisplayName: "Melt In Mouth Murgh Malai Tikka",
    category: "Tandoori Kebabs",
    itemType: "Non-Veg",
    price: 320,
    taxRate: 5,
    status: "Active",
    description:
      "Creamy boneless chicken morsels marinated in cheese, cream, cardamom and white pepper.",
    images: SAMPLE_IMAGES.butter_chicken,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "3 days ago",
  },

  // Virtual Outlet 2: Highway Inn - Burger Lab
  {
    id: "itm-bl-1",
    outletId: "vo-2",
    code: "BL-101",
    name: "Double Smashed Cheeseburger",
    onlineDisplayName: "Double Smash Angus Cheeseburger with Secret Sauce",
    category: "Burgers",
    itemType: "Non-Veg",
    price: 280,
    taxRate: 5,
    status: "Active",
    description:
      "Two seasoned smash patties, double cheddar cheese, pickled gherkins and smoked secret sauce on brioche bun.",
    images: SAMPLE_IMAGES.burger,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Today",
  },
  {
    id: "itm-bl-2",
    outletId: "vo-2",
    code: "BL-102",
    name: "Crispy Peri Peri Chicken Burger",
    onlineDisplayName: "Firecracker Crispy Peri Peri Fried Chicken Burger",
    category: "Burgers",
    itemType: "Non-Veg",
    price: 250,
    taxRate: 5,
    status: "Active",
    description:
      "Buttermilk fried chicken thigh tossed in fiery peri-peri seasoning with crunchy lettuce and herb mayo.",
    images: SAMPLE_IMAGES.burger,
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "Yesterday",
  },
  {
    id: "itm-bl-3",
    outletId: "vo-2",
    code: "BL-201",
    name: "Truffle Parmesan Loaded Fries",
    onlineDisplayName: "Golden Truffle Parmesan Crinkle Fries",
    category: "Sides & Shakes",
    itemType: "Veg",
    price: 190,
    taxRate: 5,
    status: "Active",
    description:
      "Crispy crinkle-cut fries tossed in aromatic white truffle oil, shaved parmesan and fresh parsley.",
    images: [],
    baseMenu: true,
    zomato: true,
    swiggy: true,
    direct: true,
    updatedAt: "2 days ago",
  },
];

const initialSpecialNotes: SpecialNote[] = [
  { id: "sn-1", name: "Parcel", createdAt: "7 Jun 2024", available: true },
  { id: "sn-2", name: "Non Spice", createdAt: "7 Jun 2024", available: true },
  { id: "sn-3", name: "Spice", createdAt: "7 Jun 2024", available: true },
  { id: "sn-4", name: "More Spice", createdAt: "7 Jun 2024", available: true },
  { id: "sn-5", name: "2/4", createdAt: "7 Jun 2024", available: true },
  { id: "sn-6", name: "2/3", createdAt: "7 Jun 2024", available: true },
  { id: "sn-7", name: "1/2", createdAt: "7 Jun 2024", available: true },
  { id: "sn-8", name: "Extra Dip & Cutlery", createdAt: "12 Aug 2024", available: true },
  { id: "sn-9", name: "No Onion No Garlic", createdAt: "15 Sep 2024", available: true },
  { id: "sn-10", name: "Jain Preparation", createdAt: "20 Sep 2024", available: true },
];

const initialCommissions: MenuItemCommission[] = [
  {
    id: "mc-1",
    name: "Magic Moments Jamun 180 Ml",
    category: "Vodka",
    price: 260,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-2",
    name: "Chicken Patiyala",
    category: "Non-Veg Main Course",
    price: 280,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-3",
    name: "Magic Moments Jamun 375 Ml",
    category: "Vodka",
    price: 530,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-4",
    name: "Magic Moments Jamun 750 Ml",
    category: "Vodka",
    price: 1010,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-5",
    name: "Royal Green 375 Ml",
    category: "Indian Whisky",
    price: 530,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-6",
    name: "Butter Chicken Boneless",
    category: "Non-Veg Main Course",
    price: 380,
    commissionType: "Percentage",
    commissionValue: 5,
  },
  {
    id: "mc-7",
    name: "Paneer Butter Masala",
    category: "Veg Main Course",
    price: 280,
    commissionType: "Fixed Amount",
    commissionValue: 20,
  },
  {
    id: "mc-8",
    name: "Dal Makhani Handi",
    category: "Veg Main Course",
    price: 240,
    commissionType: "Not Configured",
    commissionValue: null,
  },
  {
    id: "mc-9",
    name: "Tandoori Murgh (Full)",
    category: "Non-Veg Starters",
    price: 460,
    commissionType: "Percentage",
    commissionValue: 7.5,
  },
  {
    id: "mc-10",
    name: "Classic Virgin Mojito",
    category: "Mocktails",
    price: 160,
    commissionType: "Not Configured",
    commissionValue: null,
  },
];

const initialSchedules: MenuScheduleItem[] = [
  {
    id: "sch-1",
    title: "Base Menu",
    type: "Base Menu",
    activeRulesCount: 4,
    timingSummary: "All Days · 11:00 AM - 11:30 PM",
    status: "Active",
  },
  {
    id: "sch-2",
    title: "Home Delivery",
    type: "Home Delivery",
    activeRulesCount: 2,
    timingSummary: "Mon-Sun · 11:30 AM - 11:00 PM",
    status: "Active",
  },
  {
    id: "sch-3",
    title: "Parcel",
    type: "Parcel",
    activeRulesCount: 1,
    timingSummary: "All Day · Takeaway Counter",
    status: "Active",
  },
  {
    id: "sch-4",
    title: "Dine In",
    type: "Dine In",
    activeRulesCount: 3,
    timingSummary: "Lunch (12-4 PM) & Dinner (7-11:30 PM)",
    status: "Active",
  },
  {
    id: "sch-5",
    title: "Zomato",
    type: "Zomato",
    activeRulesCount: 2,
    timingSummary: "Aggregator Sync · Live",
    status: "Active",
  },
];

const initialPhysicalMenus: PhysicalMenuRecord[] = [];

const initialScheduleItems: ScheduleMenuItem[] = [
  {
    id: "smi-1",
    name: "Lemon Coriander Soup",
    shortCode: 39,
    indicators: "v+ | O | D",
    onlineDisplayName: "Lemon Coriander Soup",
    price: 140,
    isVeg: true,
    available: true,
    category: "Veg Soup",
  },
  {
    id: "smi-2",
    name: "Manchow Soup",
    shortCode: 40,
    indicators: "v+ | O | D",
    onlineDisplayName: "Manchow Soup",
    price: 140,
    isVeg: true,
    available: true,
    category: "Veg Soup",
  },
  {
    id: "smi-3",
    name: "Hot & Sour Soup",
    shortCode: 41,
    indicators: "v+ | O | D",
    onlineDisplayName: "Hot & Sour Soup",
    price: 140,
    isVeg: true,
    available: true,
    category: "Veg Soup",
  },
  {
    id: "smi-4",
    name: "Sweet Corn Soup",
    shortCode: 42,
    indicators: "v+ | O | D",
    onlineDisplayName: "Sweet Corn Soup",
    price: 140,
    isVeg: true,
    available: true,
    category: "Veg Soup",
  },
  {
    id: "smi-5",
    name: "Paneer Tikka",
    shortCode: 50,
    indicators: "v+ | O | D",
    onlineDisplayName: "Paneer Tikka Classic",
    price: 240,
    isVeg: true,
    available: true,
    category: "Veg Starters",
  },
  {
    id: "smi-6",
    name: "Chicken Tikka",
    shortCode: 51,
    indicators: "nv | O | D",
    onlineDisplayName: "Tandoori Chicken Tikka",
    price: 290,
    isVeg: false,
    available: true,
    category: "Non-Veg Starters",
  },
  {
    id: "smi-7",
    name: "Butter Chicken Boneless",
    shortCode: 60,
    indicators: "nv | O | D",
    onlineDisplayName: "Butter Chicken Gravy",
    price: 380,
    isVeg: false,
    available: true,
    category: "Non-Veg Main Course",
  },
  {
    id: "smi-8",
    name: "Dal Makhani Handi",
    shortCode: 61,
    indicators: "v+ | O | D",
    onlineDisplayName: "Dal Makhani",
    price: 240,
    isVeg: true,
    available: true,
    category: "Veg Main Course",
  },
  {
    id: "smi-9",
    name: "Butter Naan",
    shortCode: 70,
    indicators: "v+ | O | D",
    onlineDisplayName: "Butter Naan",
    price: 60,
    isVeg: true,
    available: true,
    category: "Bread",
  },
];

const initialScheduleCategories: ScheduleCategoryItem[] = [
  {
    id: "scat-1",
    name: "Veg Soup",
    parentCategory: "Soup & Starters",
    onlineDisplayName: "Veg Soups",
    rank: 1,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: true,
  },
  {
    id: "scat-2",
    name: "Non-Veg Soup",
    parentCategory: "Soup & Starters",
    onlineDisplayName: "Non-Veg Soups",
    rank: 2,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: true,
  },
  {
    id: "scat-3",
    name: "Veg Starters",
    parentCategory: "Soup & Starters",
    onlineDisplayName: "Veg Appetizers",
    rank: 3,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: true,
  },
  {
    id: "scat-4",
    name: "Non-Veg Starters",
    parentCategory: "Soup & Starters",
    onlineDisplayName: "Non-Veg Appetizers",
    rank: 4,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: true,
  },
  {
    id: "scat-5",
    name: "Veg Main Course",
    onlineDisplayName: "Veg Mains",
    rank: 5,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: false,
  },
  {
    id: "scat-6",
    name: "Non-Veg Main Course",
    onlineDisplayName: "Non-Veg Mains",
    rank: 6,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: false,
  },
  {
    id: "scat-7",
    name: "Bread",
    onlineDisplayName: "Breads & Rotis",
    rank: 7,
    status: "Active",
    createdAt: "7 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: false,
  },
  {
    id: "scat-8",
    name: "Egg Specialties",
    onlineDisplayName: "Egg Dishes",
    rank: 8,
    status: "Active",
    createdAt: "10 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: false,
  },
  {
    id: "scat-9",
    name: "Mocktails",
    onlineDisplayName: "Beverages & Mocktails",
    rank: 9,
    status: "Active",
    createdAt: "12 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: true,
  },
  {
    id: "scat-10",
    name: "Desserts",
    onlineDisplayName: "Mithai & Desserts",
    rank: 10,
    status: "Active",
    createdAt: "15 Jun 2024",
    modifiedAt: "5 Oct 2024",
    imageUploaded: false,
  },
];

const initialScheduleVariants: ScheduleVariantItem[] = [
  {
    id: "svar-1",
    name: "Veg",
    onlineDisplayName: "Veg",
    departmentName: "HB",
    status: "Active",
    createdAt: "1 Jun 2024",
    modifiedAt: "1 Jun 2024",
  },
  {
    id: "svar-2",
    name: "Non Veg",
    onlineDisplayName: "Non Veg",
    departmentName: "HB",
    status: "Active",
    createdAt: "1 Jun 2024",
    modifiedAt: "1 Jun 2024",
  },
  {
    id: "svar-3",
    name: "180 Ml",
    onlineDisplayName: "Quarter (180ml)",
    departmentName: "Quantity",
    status: "Active",
    createdAt: "2 Jun 2024",
    modifiedAt: "2 Jun 2024",
  },
  {
    id: "svar-4",
    name: "750 Ml",
    onlineDisplayName: "Full Bottle (750ml)",
    departmentName: "Quantity",
    status: "Active",
    createdAt: "2 Jun 2024",
    modifiedAt: "7 Jun 2024",
  },
];

const initialScheduleTables: ScheduleTableItem[] = [
  { id: "stab-1", tableNo: "BANQUET", areaName: "BANQUET", noOfPersons: 50, status: true },
  { id: "stab-2", tableNo: "G50", areaName: "Garden", noOfPersons: 4, status: true },
  { id: "stab-3", tableNo: "G49", areaName: "Garden", noOfPersons: 6, status: true },
  { id: "stab-4", tableNo: "T-01", areaName: "AC Family", noOfPersons: 4, status: true },
  { id: "stab-5", tableNo: "T-02", areaName: "AC Family", noOfPersons: 4, status: true },
];

const STORAGE_KEY_MENU_ITEMS = "retrod_pos_menu_items_store";

function loadMenuItemsFromStorage(): MenuItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MENU_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeHighwayMenuSeed(parsed);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...initialMenuItems];
}

/** Always keep Highway demo menu items; never let a UUID outlet API wipe them. */
function mergeHighwayMenuSeed(existing: MenuItem[]): MenuItem[] {
  const byId = new Map<string, MenuItem>();
  for (const seed of initialMenuItems) byId.set(seed.id, seed);
  for (const item of existing) {
    // Prefer newer local edits over seed for same id
    byId.set(item.id, item);
  }
  // If storage was wiped of Highway rows, re-attach every seed that is missing
  for (const seed of initialMenuItems) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  return [...byId.values()];
}

function ensureHighwayMenuInStore() {
  const highwayCount = menuItemsStore.filter(
    (i) => i.outletId === "outlet-primary" || i.outletId?.startsWith("vo-"),
  ).length;
  if (highwayCount === 0) {
    menuItemsStore = mergeHighwayMenuSeed(menuItemsStore);
    saveMenuItemsToStorage(menuItemsStore);
  }
}

function saveMenuItemsToStorage(items: MenuItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_MENU_ITEMS, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}

// In-memory runtime store with localStorage persistence
let menuItemsStore: MenuItem[] = loadMenuItemsFromStorage();
// Highway demo notes; UUID outlets use API only (never overwrite this store).
let specialNotesStore: SpecialNote[] = [...initialSpecialNotes];

const STORAGE_KEY_CATEGORIES = "retrod_pos_menu_categories_store";

type CategoryApiDto = {
  id: string;
  outlet?: string;
  outlet_id?: string;
  name: string;
  code?: string | null;
  sort_order?: number;
  is_active?: boolean;
  item_count?: number;
};

function mapCategoryDto(dto: CategoryApiDto, fallbackOutletId: string): MenuCategory {
  return {
    id: String(dto.id),
    outletId: String(dto.outlet || dto.outlet_id || fallbackOutletId),
    name: dto.name,
    code: dto.code ?? null,
    sortOrder: dto.sort_order ?? 0,
    isActive: dto.is_active !== false,
    itemCount: dto.item_count ?? 0,
  };
}

function seedCategoriesForOutlet(outletId: string): MenuCategory[] {
  const names = new Set<string>();
  for (const item of initialMenuItems) {
    if (item.outletId === outletId && item.category?.trim()) {
      names.add(item.category.trim());
    }
  }
  // Also pull any runtime menu items for this outlet
  for (const item of menuItemsStore) {
    if (item.outletId === outletId && item.category?.trim()) {
      names.add(item.category.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b)).map((name, idx) => ({
    id: `cat-${outletId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx}`,
    outletId,
    name,
    sortOrder: idx,
    isActive: true,
    itemCount: menuItemsStore.filter((i) => i.outletId === outletId && i.category === name)
      .length,
  }));
}

function loadLocalCategories(outletId: string): MenuCategory[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) {
        const all = JSON.parse(raw) as MenuCategory[];
        if (Array.isArray(all)) {
          const forOutlet = all.filter((c) => c.outletId === outletId);
          if (forOutlet.length > 0) return forOutlet;
        }
      }
    } catch {
      // ignore
    }
  }
  return seedCategoriesForOutlet(outletId);
}

function saveLocalCategories(outletId: string, categories: MenuCategory[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    const all: MenuCategory[] = raw ? (JSON.parse(raw) as MenuCategory[]) : [];
    const others = Array.isArray(all) ? all.filter((c) => c.outletId !== outletId) : [];
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify([...others, ...categories]));
  } catch {
    // ignore
  }
}

function renameItemsCategoryLocal(outletId: string, oldName: string, newName: string) {
  menuItemsStore = menuItemsStore.map((item) =>
    item.outletId === outletId && item.category === oldName
      ? { ...item, category: newName }
      : item,
  );
  saveMenuItemsToStorage(menuItemsStore);
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function toMenuItemWritePayload(item: Partial<MenuItem> & { outletId?: string }) {
  const itemType =
    item.itemType === "Non-Veg" ? "NON_VEG" : item.itemType === "Egg" ? "EGG" : "VEG";
  return {
    outlet: item.outletId,
    outletId: item.outletId,
    category: item.categoryId || item.category,
    categoryId: item.categoryId,
    code: item.code,
    name: item.name,
    online_display_name: item.onlineDisplayName,
    onlineDisplayName: item.onlineDisplayName,
    item_type: itemType,
    itemType: item.itemType,
    price: item.price,
    taxRate: item.taxRate,
    tax_profile: item.taxProfileId,
    status: item.status === "Inactive" ? "INACTIVE" : "ACTIVE",
    description: item.description,
    images: item.images || [],
    base_menu: item.baseMenu,
    baseMenu: item.baseMenu,
    zomato: item.zomato,
    swiggy: item.swiggy,
    direct: item.direct,
    variants: item.variants?.map((v, idx) => ({
      name: v.name,
      price: v.price,
      sort_order: idx,
      is_active: true,
    })),
    commissionType: item.commissionType,
    commissionValue: item.commissionValue,
  };
}
let commissionsStore: MenuItemCommission[] = [...initialCommissions];
let schedulesStore: MenuScheduleItem[] = [...initialSchedules];
let physicalMenusStore: PhysicalMenuRecord[] = [...initialPhysicalMenus];
let scheduleItemsStore: ScheduleMenuItem[] = [...initialScheduleItems];
let scheduleCategoriesStore: ScheduleCategoryItem[] = [...initialScheduleCategories];
let scheduleVariantsStore: ScheduleVariantItem[] = [...initialScheduleVariants];
let scheduleTablesStore: ScheduleTableItem[] = [...initialScheduleTables];

export const posMenuService = {
  // 1. Menu Items CRUD & Filtering by Outlet (calling defined API endpoints with local fallback)
  getMenuItems: async (outletId?: string) => {
    // Real HO/Kitchen (UUID): API only — blank until user feeds data. Never touch Highway store.
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.ITEMS, {
          params: { outletId, outlet_id: outletId, page_size: 500 },
        });
        return unwrapList<MenuItem>(res.data);
      } catch {
        return [];
      }
    }

    // Highway Inn + local mock outlets: restore demo catalog and filter by outlet
    ensureHighwayMenuInStore();
    if (!outletId) return [...menuItemsStore];
    return menuItemsStore.filter((item) => item.outletId === outletId);
  },

  getMenuItemById: async (id: string) => {
    try {
      const res = await httpClient.get<MenuItem>(API_ENDPOINTS.MENU.ITEM_BY_ID(id));
      if (res.data) return res.data;
    } catch {
      // Fallback
    }
    return menuItemsStore.find((i) => i.id === id) || null;
  },

  addMenuItem: async (item: Omit<MenuItem, "id" | "updatedAt">) => {
    const newItem: MenuItem = {
      ...item,
      outletId: item.outletId || "outlet-primary",
      id: `itm-${Date.now()}`,
      updatedAt: "Just now",
      images: item.images || [],
    };
    if (isBackendOutletId(newItem.outletId)) {
      const res = await httpClient.post<MenuItem>(
        API_ENDPOINTS.MENU.CREATE_ITEM,
        toMenuItemWritePayload(newItem),
      );
      return res.data;
    }
    menuItemsStore = [newItem, ...menuItemsStore];
    saveMenuItemsToStorage(menuItemsStore);
    return newItem;
  },

  updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
    if (isBackendOutletId(data.outletId) || /^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(
        API_ENDPOINTS.MENU.UPDATE_ITEM(id),
        toMenuItemWritePayload(data),
      );
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) =>
      item.id === id ? { ...item, ...data, updatedAt: "Just now" } : item,
    );
    saveMenuItemsToStorage(menuItemsStore);
    return menuItemsStore.find((i) => i.id === id);
  },

  deleteMenuItem: async (id: string) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      await httpClient.delete(API_ENDPOINTS.MENU.DELETE_ITEM(id));
      return true;
    }
    menuItemsStore = menuItemsStore.filter((i) => i.id !== id);
    saveMenuItemsToStorage(menuItemsStore);
    return true;
  },

  // 2. Channel & Platform Availability
  toggleItemPlatform: async (id: string, platform: "zomato" | "swiggy" | "direct" | "baseMenu") => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.TOGGLE_PLATFORM(id, platform));
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === id) {
        const nextVal = !item[platform];
        return {
          ...item,
          [platform]: nextVal,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    saveMenuItemsToStorage(menuItemsStore);
    return menuItemsStore.find((i) => i.id === id);
  },

  bulkUpdatePlatformAvailability: async (
    ids: string[],
    updates: {
      zomato?: boolean;
      swiggy?: boolean;
      direct?: boolean;
      baseMenu?: boolean;
    },
  ) => {
    if (ids.some((id) => /^[0-9a-f-]{36}$/i.test(id))) {
      await httpClient.post(API_ENDPOINTS.MENU.BULK_PLATFORMS, { ids, updates });
      return true;
    }
    const idSet = new Set(ids);
    menuItemsStore = menuItemsStore.map((item) => {
      if (idSet.has(item.id)) {
        return {
          ...item,
          ...updates,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    return true;
  },

  // Backward compatibility alias for stock items
  getStockItems: async (outletId?: string) => {
    if (!outletId) return [...menuItemsStore];
    return menuItemsStore.filter((item) => item.outletId === outletId);
  },

  toggleStockStatus: async (id: string) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.TOGGLE_STATUS(id));
      return res.data;
    }
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === id) {
        const nextStatus = item.status === "Active" ? "Inactive" : "Active";
        return {
          ...item,
          status: nextStatus,
          updatedAt: "Just now",
          nextAvailableTime: nextStatus === "Inactive" ? "Tomorrow 10:00 AM" : undefined,
        };
      }
      return item;
    });
    return menuItemsStore.find((i) => i.id === id);
  },

  // 3. Multi-Image Management per Item
  addItemImages: async (itemId: string, newImages: MenuItemImage[]) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        const existing = item.images || [];
        const hasExistingPrimary = existing.some((img) => img.isPrimary);
        const processed = newImages.map((img, idx) => ({
          ...img,
          isPrimary: !hasExistingPrimary && idx === 0 ? true : !!img.isPrimary,
        }));
        return {
          ...item,
          images: [...existing, ...processed],
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  removeItemImage: async (itemId: string, imageId: string) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        const filtered = (item.images || []).filter((img) => img.id !== imageId);
        // If we removed the primary image and there are remaining images, set the first as primary
        const hasPrimary = filtered.some((img) => img.isPrimary);
        if (!hasPrimary && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isPrimary: true };
        }
        return {
          ...item,
          images: filtered,
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  setPrimaryImage: async (itemId: string, imageId: string) => {
    menuItemsStore = menuItemsStore.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          images: (item.images || []).map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          })),
          updatedAt: "Just now",
        };
      }
      return item;
    });
    const updated = menuItemsStore.find((i) => i.id === itemId) || null;
    try {
      if (updated) {
        await httpClient.put(API_ENDPOINTS.MENU.ITEM_IMAGES(itemId), {
          images: updated.images,
        });
      }
    } catch {
      // Fallback to local store
    }
    saveMenuItemsToStorage(menuItemsStore);
    return updated;
  },

  // 4. Special Notes (outlet-scoped via API when outlet is a real UUID)
  // ---- Menu Categories (outlet-scoped) ----
  getCategories: async (outletId: string): Promise<MenuCategory[]> => {
    if (!outletId) return [];
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.CATEGORIES, {
          params: { outlet_id: outletId, outletId, page_size: 200 },
        });
        return unwrapList<CategoryApiDto>(res.data).map((d) => mapCategoryDto(d, outletId));
      } catch {
        return [];
      }
    }
    ensureHighwayMenuInStore();
    const local = loadLocalCategories(outletId);
    // Keep item counts fresh
    return local
      .map((c) => ({
        ...c,
        itemCount: menuItemsStore.filter(
          (i) => i.outletId === outletId && i.category === c.name,
        ).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addCategory: async (outletId: string, name: string): Promise<MenuCategory> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name is required");
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<CategoryApiDto>(API_ENDPOINTS.MENU.CATEGORIES, {
        outlet: outletId,
        name: trimmed,
        is_active: true,
      });
      return mapCategoryDto(res.data, outletId);
    }
    const existing = loadLocalCategories(outletId);
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const created: MenuCategory = {
      id: `cat-${Date.now()}`,
      outletId,
      name: trimmed,
      sortOrder: existing.length,
      isActive: true,
      itemCount: 0,
    };
    const next = [...existing, created].sort((a, b) => a.name.localeCompare(b.name));
    saveLocalCategories(outletId, next);
    return created;
  },

  updateCategory: async (
    outletId: string,
    categoryId: string,
    data: { name: string },
  ): Promise<MenuCategory> => {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error("Category name is required");
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.patch<CategoryApiDto>(
        API_ENDPOINTS.MENU.CATEGORY_BY_ID(categoryId),
        { name: trimmed },
      );
      return mapCategoryDto(res.data, outletId);
    }
    const existing = loadLocalCategories(outletId);
    const current = existing.find((c) => c.id === categoryId);
    if (!current) throw new Error("Category not found");
    if (
      existing.some(
        (c) => c.id !== categoryId && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const oldName = current.name;
    const next = existing.map((c) =>
      c.id === categoryId ? { ...c, name: trimmed } : c,
    );
    saveLocalCategories(outletId, next);
    if (oldName !== trimmed) {
      renameItemsCategoryLocal(outletId, oldName, trimmed);
    }
    return next.find((c) => c.id === categoryId)!;
  },

  deleteCategory: async (outletId: string, categoryId: string): Promise<void> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(API_ENDPOINTS.MENU.CATEGORY_BY_ID(categoryId));
      return;
    }
    const existing = loadLocalCategories(outletId);
    const current = existing.find((c) => c.id === categoryId);
    if (!current) return;
    const inUse = menuItemsStore.some(
      (i) => i.outletId === outletId && i.category === current.name,
    );
    if (inUse) {
      throw new Error(
        `Cannot remove "${current.name}" — menu items still use this category. Reassign or delete those items first.`,
      );
    }
    saveLocalCategories(
      outletId,
      existing.filter((c) => c.id !== categoryId),
    );
  },

  getSpecialNotes: async (outletId?: string) => {
    // UUID outlets: API only (empty until created). Do not wipe Highway notes store.
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.MENU.SPECIAL_NOTES, {
          params: { outletId, outlet_id: outletId, page_size: 200 },
        });
        return unwrapList<SpecialNote>(res.data).map((n) => ({
          id: String(n.id),
          name: n.name,
          createdAt:
            typeof n.createdAt === "string"
              ? n.createdAt
              : new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
          available: Boolean((n as SpecialNote).available ?? true),
        }));
      } catch {
        return [];
      }
    }

    if (specialNotesStore.length === 0) {
      specialNotesStore = [...initialSpecialNotes];
    }
    return [...specialNotesStore];
  },
  addSpecialNote: async (name: string, available = true, outletId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Special note name is required");
    try {
      const res = await httpClient.post<SpecialNote>(API_ENDPOINTS.MENU.SPECIAL_NOTES, {
        name: trimmed,
        available,
        outlet: outletId || null,
      });
      if (res.data?.id) {
        const note: SpecialNote = {
          id: String(res.data.id),
          name: res.data.name || trimmed,
          createdAt:
            typeof res.data.createdAt === "string"
              ? res.data.createdAt
              : new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
          available: Boolean(res.data.available ?? available),
        };
        specialNotesStore = [note, ...specialNotesStore.filter((n) => n.id !== note.id)];
        return note;
      }
    } catch {
      // local fallback for mock outlets
    }
    if (isBackendOutletId(outletId)) {
      throw new Error("Failed to save special note");
    }
    const newNote: SpecialNote = {
      id: `sn-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      available,
    };
    specialNotesStore = [newNote, ...specialNotesStore];
    return newNote;
  },
  toggleSpecialNote: async (id: string) => {
    const current = specialNotesStore.find((n) => n.id === id);
    const nextAvailable = !(current?.available ?? true);
    try {
      await httpClient.patch(API_ENDPOINTS.MENU.SPECIAL_NOTE_BY_ID(id), {
        available: nextAvailable,
      });
    } catch {
      // local toggle
    }
    specialNotesStore = specialNotesStore.map((note) =>
      note.id === id ? { ...note, available: !note.available } : note,
    );
    return specialNotesStore.find((n) => n.id === id);
  },
  deleteSpecialNote: async (id: string) => {
    try {
      await httpClient.delete(API_ENDPOINTS.MENU.SPECIAL_NOTE_BY_ID(id));
    } catch {
      // local delete
    }
    specialNotesStore = specialNotesStore.filter((n) => n.id !== id);
    return true;
  },

  // 5. Item Commissions
  getCommissions: async (outletId?: string) => {
    if (isBackendOutletId(outletId)) {
      const items = await posMenuService.getMenuItems(outletId);
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        commissionType: item.commissionType || "Not Configured",
        commissionValue: item.commissionValue ?? null,
      }));
    }
    return [...commissionsStore];
  },
  updateCommission: async (
    id: string,
    commissionType: "Not Configured" | "Percentage" | "Fixed Amount",
    commissionValue: number | null,
  ) => {
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const res = await httpClient.patch<MenuItem>(API_ENDPOINTS.MENU.UPDATE_ITEM(id), {
        commissionType,
        commissionValue,
      });
      return {
        id: res.data.id,
        name: res.data.name,
        category: res.data.category,
        price: res.data.price,
        commissionType: res.data.commissionType || commissionType,
        commissionValue: res.data.commissionValue ?? commissionValue,
      };
    }
    commissionsStore = commissionsStore.map((item) =>
      item.id === id ? { ...item, commissionType, commissionValue } : item,
    );
    return commissionsStore.find((i) => i.id === id);
  },

  // 6. Schedules
  getSchedules: async () => [...schedulesStore],

  // 7. Physical Menu
  getPhysicalMenus: async () => [...physicalMenusStore],
  addPhysicalMenu: async (name: string, type: string, fileSize: string) => {
    const newFile: PhysicalMenuRecord = {
      id: `pm-${Date.now()}`,
      name,
      type,
      uploadedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      fileSize,
      url: "#",
    };
    physicalMenusStore = [newFile, ...physicalMenusStore];
    return newFile;
  },
  deletePhysicalMenu: async (id: string) => {
    physicalMenusStore = physicalMenusStore.filter((f) => f.id !== id);
    return true;
  },

  // 8. Schedule Details Sub-Views
  getScheduleItems: async () => [...scheduleItemsStore],
  toggleScheduleItem: async (id: string) => {
    scheduleItemsStore = scheduleItemsStore.map((item) =>
      item.id === id ? { ...item, available: !item.available } : item,
    );
    return scheduleItemsStore.find((i) => i.id === id);
  },
  addScheduleItem: async (item: Omit<ScheduleMenuItem, "id">) => {
    const newItem: ScheduleMenuItem = {
      ...item,
      id: `smi-${Date.now()}`,
    };
    scheduleItemsStore = [newItem, ...scheduleItemsStore];
    return newItem;
  },

  getScheduleCategories: async () => [...scheduleCategoriesStore],
  addScheduleCategory: async (name: string, parentCategory?: string) => {
    const newCat: ScheduleCategoryItem = {
      id: `scat-${Date.now()}`,
      name,
      parentCategory,
      rank: scheduleCategoriesStore.length + 1,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      modifiedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      imageUploaded: false,
    };
    scheduleCategoriesStore = [...scheduleCategoriesStore, newCat];
    return newCat;
  },

  getScheduleVariants: async () => [...scheduleVariantsStore],
  addScheduleVariant: async (name: string, departmentName: string) => {
    const newVar: ScheduleVariantItem = {
      id: `svar-${Date.now()}`,
      name,
      departmentName,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      modifiedAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    scheduleVariantsStore = [...scheduleVariantsStore, newVar];
    return newVar;
  },

  getScheduleTables: async () => [...scheduleTablesStore],
  toggleScheduleTable: async (id: string) => {
    scheduleTablesStore = scheduleTablesStore.map((table) =>
      table.id === id ? { ...table, status: !table.status } : table,
    );
    return scheduleTablesStore.find((t) => t.id === id);
  },
  addScheduleTable: async (tableNo: string, areaName: string, noOfPersons?: number) => {
    const newTab: ScheduleTableItem = {
      id: `stab-${Date.now()}`,
      tableNo,
      areaName,
      noOfPersons: noOfPersons || 4,
      status: true,
    };
    scheduleTablesStore = [...scheduleTablesStore, newTab];
    return newTab;
  },

  // 9. Sync POS
  syncPos: async () => {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      lastSync: "Just now",
      totalItemsSynced: menuItemsStore.length,
      categoriesSynced: scheduleCategoriesStore.length,
    };
  },

  // 10. Virtual Outlets
  getVirtualOutlets: async (): Promise<VirtualOutlet[]> => {
    return [...virtualOutletsStore];
  },

  addVirtualOutlet: async (outlet: { name: string; cuisine?: string }): Promise<VirtualOutlet> => {
    const newVo: VirtualOutlet = {
      id: `vo-${Date.now()}`,
      name: outlet.name,
      code: `VO-${Math.floor(100 + Math.random() * 900)}`,
      type: "Virtual Outlet",
      cuisine: outlet.cuisine || "Multi-Cuisine",
      description: "Cloud kitchen virtual brand",
      address: "Main Outlet Kitchen",
      contact: "+91 98765 00000",
      orderTypes: ["Delivery", "Takeaway"],
      status: "Active",
      menuCount: 0,
    };
    virtualOutletsStore = [...virtualOutletsStore, newVo];
    return newVo;
  },
};

let virtualOutletsStore: VirtualOutlet[] = [
  {
    id: "vo-1",
    name: "Biryani Blues (Cloud)",
    code: "BB-01",
    type: "Virtual Outlet",
    cuisine: "Hyderabadi / Biryani",
    description: "Cloud kitchen virtual outlet for biryani specials",
    address: "Central Kitchen, Block B",
    contact: "+91 98765 43210",
    orderTypes: ["Delivery", "Takeaway"],
    status: "Active",
    menuCount: 24,
  },
  {
    id: "vo-2",
    name: "Burger Bae (Cloud)",
    code: "BB-02",
    type: "Virtual Outlet",
    cuisine: "American / Fast Food",
    description: "Virtual burger brand",
    address: "Central Kitchen, Block B",
    contact: "+91 98765 43211",
    orderTypes: ["Delivery"],
    status: "Active",
    menuCount: 18,
  },
];
