export const getUserScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
          width: { max: 1920 },
          height: { max: 1080 }
        },
        audio: false
      });
  
      return stream;
    } catch (err) {
      console.error("Screen capture denied", err);
      return null;
    }
  };
  