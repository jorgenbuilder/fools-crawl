self.onmessage = async ({ data: { url } }) => {
  const buffer = await loadImage(url);
  self.postMessage(buffer, [buffer]);
};

async function loadImage(url) {
  const response = await fetch(url);
  return (await response.blob()).arrayBuffer();
}
