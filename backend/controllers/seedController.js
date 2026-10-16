const bcrypt = require('bcryptjs');
const { getDBMode } = require('../config/db');
const { memoryStore, generateId } = require('../utils/memoryStore');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const seedData = async (req, res) => {
  try {
    const isMemDB = getDBMode();

    // Sample users
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    const usersData = [
      {
        _id: 'user_alex',
        name: 'Hoàng Anh Tech',
        email: 'hoanganh@techblog.vn',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        bio: 'Senior Fullstack Engineer | Chuyên gia Node.js & ReactJS với 8+ năm kinh nghiệm xây dựng ứng dụng quy mô lớn.',
        role: 'admin'
      },
      {
        _id: 'user_dev',
        name: 'Minh Trí Code',
        email: 'minhtri@devs.io',
        password: defaultPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        bio: 'Backend Architecture Enthusiast & Cloud Native Explorer. Đam mê MongoDB, Redis và Microservices.',
        role: 'author'
      }
    ];

    // Sample categories
    const categoriesData = [
      {
        _id: 'cat_react',
        name: 'React & Frontend',
        slug: 'react-frontend',
        description: 'Tất tần tật về ReactJS, Next.js, Redux Toolkit, TailwindCSS và tối ưu hiệu năng UI/UX.',
        color: '#06b6d4',
        icon: 'Code2'
      },
      {
        _id: 'cat_nodejs',
        name: 'Node.js & Backend',
        slug: 'nodejs-backend',
        description: 'Xây dựng RESTful API, GraphQL, Express.js, Microservices và bảo mật Web server.',
        color: '#10b981',
        icon: 'Server'
      },
      {
        _id: 'cat_database',
        name: 'MongoDB & Database',
        slug: 'mongodb-database',
        description: 'Thiết kế Schema, Tối ưu Query Aggregation, Indexing và kiến trúc Database NoSQL.',
        color: '#f59e0b',
        icon: 'Database'
      },
      {
        _id: 'cat_ai',
        name: 'AI & Công Nghệ',
        slug: 'ai-technology',
        description: 'Cập nhật xu hướng AI, Large Language Models (LLMs), Agentic Coding và Công cụ lập trình hiện đại.',
        color: '#8b5cf6',
        icon: 'Cpu'
      }
    ];

    // Sample posts
    const postsData = [
      {
        _id: 'post_1',
        title: 'Hướng Dẫn Xây Dựng Ứng Dụng MERN Stack Chuẩn Sản Phẩm (Production Ready) 2026',
        slug: 'huong-dan-xay-dung-ung-dung-mern-stack-chuon-san-pham-2026',
        excerpt: 'Khám phá quy trình toàn diện tạo web app với MongoDB, Express, React và Node.js từ thiết kế REST API đến tối ưu UX và Deploy.',
        content: `## 🚀 Giới Thiệu Về MERN Stack

MERN Stack (MongoDB, Express.js, React.js, Node.js) tiếp tục là bộ công cụ lập trình web fullstack phổ biến và mạnh mẽ nhất thế giới công nghệ hiện nay. Việc kết hợp giữa JavaScript ở cả Frontend lẫn Backend giúp tối ưu hóa hiệu suất phát triển và dễ dàng mở rộng.

---

### 1. Kiến Trúc Backend RESTful API Vững Chắc

Một ứng dụng Express.js chuyên nghiệp cần tuân thủ cấu trúc phân tầng rõ ràng:
- **Routes Layer**: Tiếp nhận yêu cầu HTTP và phân luồng.
- **Controllers Layer**: Chứa toàn bộ nghiệp vụ xử lý dữ liệu.
- **Models Layer**: Định nghĩa Schema Mongoose bảo toàn kiểu dữ liệu.
- **Middleware**: Kiểm tra JWT Token, xử lý lỗi tập trung.

\`\`\`javascript
// Ví dụ Middleware kiểm tra token JWT trong Express
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Truy cập bị từ chối!' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};
\`\`\`

---

### 2. Quản Lý State & Giao Diện React Hiện Đại

Ở phía Frontend React:
- Sử dụng **Vite** để khởi tạo dự án nhanh hơn 10x so với CRA.
- **Vibe Styling**: Thiết kế hiệu ứng Kính mờ (Glassmorphism), Dark Mode mượt mà và CSS Variables.
- **Custom Hooks**: Tách biệt logic gọi API với component UI.

---

### 3. Tối Ưu Truy Vấn MongoDB Aggregation Pipeline

Thay vì tải hàng nghìn document về ứng dụng để lọc, hãy tận dụng sức mạnh tính toán của **MongoDB Aggregation Pipeline**:

\`\`\`js
const popularPosts = await Post.aggregate([
  { $match: { status: 'published' } },
  { $sort: { views: -1 } },
  { $limit: 5 }
]);
\`\`\`

> 💡 **Tip:** Đừng quên tạo Index cho các trường thường xuyên tìm kiếm như \`slug\`, \`tags\` và \`category\`!`,
        coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
        category: 'cat_react',
        author: 'user_alex',
        tags: ['MERN', 'ReactJS', 'NodeJS', 'MongoDB', 'Fullstack'],
        readTime: 7,
        views: 1420,
        likes: 189,
        isFeatured: true,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        _id: 'post_2',
        title: 'Bí Quyết Tối Ưu Hiệu Năng React App Với Custom Hooks Và Dynamic Imports',
        slug: 'bi-quyet-toi-uu-hieu-nang-react-app-voi-custom-hooks-va-dynamic-imports',
        excerpt: 'Cách tăng điểm Google Lighthouse lên 98+ bằng việc giảm Bundle Size, sử dụng React.lazy, useMemo và useCallback đúng cách.',
        content: `## ⚡ Vì Sao Hiệu Năng Web App Lại Tối Quan Trọng?

Tốc độ tải trang ảnh hưởng trực tiếp tới trải nghiệm người dùng (UX) và thứ hạng SEO. Một ứng dụng React nặng nề với Bundle size lớn sẽ khiến trải nghiệm bị gián đoạn.

### Các Kỹ Thuật Tối Ưu Hàng Đầu:

1. **Code Splitting với \`React.lazy\` & \`Suspense\`**
2. **Tránh Re-render Không Cần Thiết** với \`useMemo\` và \`React.memo\`
3. **Lazy Loading Images** với Intersection Observer API.

\`\`\`jsx
import React, { lazy, Suspense } from 'react';

const DashboardChart = lazy(() => import('./DashboardChart'));

function AnalyticsView() {
  return (
    <Suspense fallback={<div className="spinner">Đang tải biểu đồ...</div>}>
      <DashboardChart />
    </Suspense>
  );
}
\`\`\`

Hãy áp dụng ngay vào dự án của bạn để cảm nhận sự khác biệt mượt mà!`,
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        category: 'cat_react',
        author: 'user_alex',
        tags: ['ReactJS', 'Performance', 'JavaScript', 'Frontend'],
        readTime: 5,
        views: 980,
        likes: 142,
        isFeatured: false,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        _id: 'post_3',
        title: 'Thiết Kế Kiến Trúc Microservices Với Node.js, Express và Redis Caching',
        slug: 'thiet-ke-kien-truc-microservices-voi-nodejs-express-va-redis-caching',
        excerpt: 'Hướng dẫn chia nhỏ Monolith application thành các dịch vụ độc lập, giao tiếp qua REST/gRPC và tăng tốc độ nhờ Redis Cache.',
        content: `## 🏢 Chuyển Đổi Từ Monolith Sang Microservices

Khi ứng dụng tăng trưởng vượt bậc, kiến trúc Microservices giúp các đội ngũ phát triển làm việc độc lập mà không ảnh hưởng lẫn nhau.

### Những Lợi Ích Cốt Lõi:
- **Tự động mở rộng (Scalability)**: Mỗi service có thể được scale riêng biệt dựa trên lượng tải.
- **Công nghệ linh hoạt**: Mỗi service có thể chọn CSDL phù hợp nhất.
- **Giảm rủi ro sụp đổ hệ thống**: Lỗi tại 1 service không làm sập toàn bộ web app.

\`\`\`javascript
// Caching dữ liệu bài viết hot bằng Redis trong Node.js
const redis = require('redis');
const client = redis.createClient();

async function getCachedPost(postId) {
  const cacheKey = \`post:\${postId}\`;
  const cachedData = await client.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  const post = await Post.findById(postId);
  await client.setEx(cacheKey, 3600, JSON.stringify(post)); // Cache 1 giờ
  return post;
}
\`\`\``,
        coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
        category: 'cat_nodejs',
        author: 'user_dev',
        tags: ['NodeJS', 'ExpressJS', 'Microservices', 'Redis', 'Backend'],
        readTime: 8,
        views: 1250,
        likes: 210,
        isFeatured: true,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        _id: 'post_4',
        title: 'Kỷ Nguyên Lập Trình AI: Tối Ưu Hóa Tốc Độ Phát Triển Ứng Dụng 2026',
        slug: 'ky-nguyen-lap-trinh-ai-toi-uu-hoa-toc-do-phat-trien-ung-dung-2026',
        excerpt: 'Cách các lập trình viên hiện đại kết hợp AI Assistant, Agentic Workflows để tăng tốc độ viết code gấp 3 lần.',
        content: `## 🤖 AI Không Thay Thế Lập Trình Viên, Nhưng Lập Trình Viên Dùng AI Sẽ Thay Thế Lập Trình Viên Không Dùng AI

Sự bùng nổ của các mô hình trí tuệ nhân tạo thế hệ mới (Agentic AI) đang định hình lại cách chúng ta thiết kế phần mềm.

### 🌟 3 Thay Đổi Lớn Nhất Trong Quy Trình Lập Trình:
1. **Tự động sinh Code Boilerplate & Unit Tests**.
2. **Phân tích Log Lỗi & Debug trong vài giây**.
3. **Chuyển đổi UI Mockup thành giao diện HTML/CSS/React sống động**.

Hãy sẵn sàng đón nhận và làm chủ các công cụ hỗ trợ thông minh này!`,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
        category: 'cat_ai',
        author: 'user_alex',
        tags: ['AI', 'TechNews', 'FutureTech', 'DeveloperExperience'],
        readTime: 6,
        views: 2150,
        likes: 380,
        isFeatured: true,
        status: 'published',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    // Sample comments
    const commentsData = [
      {
        _id: 'comm_1',
        post: 'post_1',
        authorName: 'Độc giả Thanh Tùng',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: 'Bài viết rất chi tiết và thiết thực! Mình vừa áp dụng phần cấu hình Mongoose fallback và ứng dụng chạy rất mượt.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        _id: 'comm_2',
        post: 'post_1',
        authorName: 'Nguyễn Bích Phương',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Giao diện blog của dự án này mượt quá tác giả ơi! Cảm ơn anh đã chia sẻ bài viết tuyệt vời.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];

    if (isMemDB) {
      memoryStore.users = [...usersData];
      memoryStore.categories = [...categoriesData];
      memoryStore.posts = postsData.map(p => ({
        ...p,
        author: usersData.find(u => u._id === p.author),
        category: categoriesData.find(c => c._id === p.category)
      }));
      memoryStore.comments = [...commentsData];

      return res.json({
        message: 'Nạp dữ liệu mẫu vào In-Memory Store thành công!',
        stats: {
          users: memoryStore.users.length,
          categories: memoryStore.categories.length,
          posts: memoryStore.posts.length,
          comments: memoryStore.comments.length
        }
      });
    } else {
      await User.deleteMany({});
      await Category.deleteMany({});
      await Post.deleteMany({});
      await Comment.deleteMany({});

      const insertedUsers = await User.insertMany(usersData.map(({ _id, ...u }) => u));
      const insertedCategories = await Category.insertMany(categoriesData.map(({ _id, ...c }) => c));

      const adminUser = insertedUsers[0];
      const authorUser = insertedUsers[1];
      const catReact = insertedCategories[0];
      const catNode = insertedCategories[1];
      const catAi = insertedCategories[3];

      const mongoPostsData = [
        {
          ...postsData[0],
          author: adminUser._id,
          category: catReact._id
        },
        {
          ...postsData[1],
          author: adminUser._id,
          category: catReact._id
        },
        {
          ...postsData[2],
          author: authorUser._id,
          category: catNode._id
        },
        {
          ...postsData[3],
          author: adminUser._id,
          category: catAi._id
        }
      ].map(({ _id, ...p }) => p);

      const insertedPosts = await Post.insertMany(mongoPostsData);

      await Comment.insertMany([
        {
          post: insertedPosts[0]._id,
          authorName: 'Độc giả Thanh Tùng',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          content: 'Bài viết rất chi tiết và thiết thực! Mình vừa áp dụng phần cấu hình Mongoose fallback và ứng dụng chạy rất mượt.'
        }
      ]);

      return res.json({
        message: 'Nạp dữ liệu mẫu vào MongoDB thành công!',
        stats: {
          users: insertedUsers.length,
          categories: insertedCategories.length,
          posts: insertedPosts.length
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { seedData };
