## Getting Started

config your .env

```
EDGE_CONFIG=
BLOB_READ_WRITE_TOKEN=
MYSQL_DATABASE=
MYSQL_PASSWORD=
MYSQL_USER=
MYSQL_PORT=
MYSQL_HOST=
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
OSU_REDIRECT_URI=
```
数据库需要init,还没准备好init页面

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## get svg poz
```js
const element = document.querySelector('.text-yu');

// 方法1: 使用 getBoundingClientRect()
const rect = element.getBoundingClientRect();
console.log('元素边界:', rect);
console.log('中心点 x:', rect.left + rect.width / 2);
console.log('中心点 y:', rect.top + rect.height / 2);
console.log('相对中心点 x:', rect.width / 2);
console.log('相对中心点 y:', rect.height / 2);

// 方法2: 对于 SVG 元素，使用 getBBox()
if (element.getBBox) {
    const bbox = element.getBBox();
    console.log('SVG BBox:', bbox);
    console.log('中心点 x:', bbox.x + bbox.width / 2);
    console.log('中心点 y:', bbox.y + bbox.height / 2);
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
