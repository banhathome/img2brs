import img2brs from 'img2brs';

self.onmessage = async function(e) {
  const { image, options } = e.data;

  try {
    const result = img2brs(image, options);

    self.postMessage({
      type: 'success',
      result,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message || error.toString()
    });
  }
};
