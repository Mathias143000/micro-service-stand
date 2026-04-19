import http from "node:http";

const imageSets = [
  [
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  [
    "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  [
    "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
  [
    "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/6492403/pexels-photo-6492403.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1200",
  ],
];

function buildGallery(id, urls) {
  return [
    { id: `${id}-exterior`, url: urls[0], category: "exterior" },
    { id: `${id}-interior`, url: urls[1], category: "interior" },
    { id: `${id}-floorplan`, url: urls[2], category: "floorplan" },
  ];
}

function createPost({
  id,
  title,
  city,
  address,
  price,
  bedroom,
  bathroom,
  type,
  property,
  size,
  latitude,
  longitude,
  username,
  avatar,
  images,
}) {
  return {
    id,
    title,
    city,
    address,
    price,
    bedroom,
    bathroom,
    type,
    property,
    latitude,
    longitude,
    userId: id + 100,
    user: {
      username,
      mobile_number: `+91999900000${id}`,
      avatar,
    },
    imageGallery: buildGallery(id, images),
    images: [],
    postDetail: {
      desc: `<p>${title} выделяется спокойной отделкой, хорошим дневным светом и более премиальным ритмом планировки по сравнению с соседними объектами.</p><p>Подходит для визуальной проверки витрины и финальной полировки маркетплейса.</p>`,
      size,
      utilities: id % 2 === 0 ? "owner" : "tenant",
      pet: "allowed",
      income: "Стандартная банковская проверка",
      school: 0.7,
      bus: 0.4,
      restaurant: 0.3,
    },
    savedPrice: Math.round(price * 1.04),
    priceAlertEnabled: id % 2 === 1,
    priceDropAmount: Math.round(price * 0.04),
    priceDropDetected: id % 2 === 1,
  };
}

const posts = [
  createPost({
    id: 1,
    title: "Sea Breeze Residence with panoramic terraces",
    city: "Mumbai",
    address: "14 Palm Residency Road, Bandra West, Mumbai",
    price: 27500000,
    bedroom: 3,
    bathroom: 2,
    type: "buy",
    property: "apartment",
    size: 1680,
    latitude: 19.0607,
    longitude: 72.8363,
    username: "Aarav Realty",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    images: imageSets[0],
  }),
  createPost({
    id: 2,
    title: "Aurora Courtyard townhome with private garden",
    city: "Bengaluru",
    address: "7 Garden Grove Lane, Whitefield, Bengaluru",
    price: 19800000,
    bedroom: 4,
    bathroom: 3,
    type: "buy",
    property: "house",
    size: 1920,
    latitude: 12.9698,
    longitude: 77.75,
    username: "Violet Habitat",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400",
    images: imageSets[1],
  }),
  createPost({
    id: 3,
    title: "Skyline Studio loft above the arts district",
    city: "Mumbai",
    address: "22 River Walk Avenue, Lower Parel, Mumbai",
    price: 62000,
    bedroom: 1,
    bathroom: 1,
    type: "rent",
    property: "condo",
    size: 610,
    latitude: 18.9977,
    longitude: 72.8308,
    username: "Urban Lease Co",
    avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    images: imageSets[2],
  }),
  createPost({
    id: 4,
    title: "Harbor Crest new-build penthouse release",
    city: "Goa",
    address: "51 Marina Point, Dona Paula, Goa",
    price: 38200000,
    bedroom: 4,
    bathroom: 4,
    type: "buy",
    property: "condo",
    size: 2280,
    latitude: 15.4589,
    longitude: 73.807,
    username: "Skyline Homes",
    avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400",
    images: imageSets[3],
  }),
];

const postById = new Map(posts.map((post) => [String(post.id), post]));

function writeJson(res, status, body, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "http://127.0.0.1:5176";
  const url = new URL(req.url, "http://127.0.0.1:18080");

  if (req.method === "OPTIONS") {
    writeJson(res, 204, {}, origin);
    return;
  }

  if (req.method === "GET" && url.pathname === "/posts") {
    const city = url.searchParams.get("city");
    const filteredPosts = city ? posts.filter((post) => post.city === city) : posts;
    writeJson(res, 200, filteredPosts, origin);
    return;
  }

  if (req.method === "GET" && url.pathname === "/posts/nearby") {
    writeJson(res, 200, posts.slice(0, 3), origin);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/posts/")) {
    const id = url.pathname.split("/").pop();
    const post = postById.get(id);
    writeJson(res, post ? 200 : 404, post || { message: "Not found" }, origin);
    return;
  }

  if (req.method === "POST" && (url.pathname === "/users/save" || url.pathname === "/api/marketplace-deals")) {
    writeJson(res, 200, { ok: true }, origin);
    return;
  }

  writeJson(res, 200, [], origin);
});

server.listen(18080, "127.0.0.1", () => {
  console.log("Mock API ready on http://127.0.0.1:18080");
});
