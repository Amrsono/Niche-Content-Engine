const urls = [
  'https://image.pollinations.ai/prompt/cat',
  'https://pollinations.ai/p/cat',
  'https://pollinations.ai/prompt/cat',
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
