const urls = [
  'https://image.pollinations.ai/prompt/cat.jpg?width=1200&height=630',
  'https://image.pollinations.ai/prompt/test.jpg',
  'https://pollinations.ai/p/cat',
];

async function main() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, '=>', res.status, res.headers.get('content-type'));
    } catch (e) {
      console.log(url, '=> ERROR', e.message);
    }
  }
}
main();
