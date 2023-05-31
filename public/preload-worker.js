const preload = Promise.all(
  Array(56)
    .fill(0)
    .map((_, i) => loadImage(mapToFile(i)))
);

function mapToFile(index) {
  if (index < 0 || index >= 56) throw new Error("Invalid index");
  const suit = ["S", "W", "P", "C"][Math.floor(index / 14)];
  const value = (index % 14) + 1;
  return `/deck-2/${suit}${value}.png`;
}

self.onmessage = async () => {
  const response = await preload;
  self.postMessage(
    response,
    response.map((x) => x.data.buffer)
  );
};

async function loadImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  // const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  // const ctx = canvas.getContext("2d");
  // ctx.drawImage(bitmap, 0, 0);

  // const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  // const { data, width, height } = imageData;

  // const array = new Uint8Array(width * height * 4); // Assuming RGBA format

  // for (let i = 0; i < data.length; i++) {
  //   array[i] = data[i] * 255;
  // }

  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    width: bitmap.width,
    height: bitmap.height,
  };
}
