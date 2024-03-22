import React, { useState, useRef } from 'react';
import axios from 'axios'

const CameraCapture = () => {
  const [videoStream, setVideoStream] = useState(null);
  const [videoFacingMode, setVideoFacingMode] = useState('environment'); // Default to primary camera
  const [recentImage, setRecentImage] = useState(null);
  const [imgurl, setImgUrl] = useState('')
  const [capturedImages, setCapturedImages] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modalImage, setModalImage] = useState(null);
  const [data,setData] = useState([])
  // Initialize camera stream
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: videoFacingMode,
          width: { ideal: 300 },
          height: { ideal: 300 }
        }
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Capture image from video stream
  const captureImage = async() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
    const imgPayload = {
      inlineData: {
        data: imageDataURL,
        mimeType:'image/png',
      },
    };
    const responseStructure = `
    "total_objects": 0,
    "items": [{
      "name": 'object 1',
      "prediction_rate": 0.93,
      "co-ordinates": {
        "x1": 0,
        "y1": 0,
        "x2": 0,
        "y2": 0,
      }
    },{
      "name": 'object 2',
      "prediction_rate": 0.83,
      "co-ordinates": {
        "x1": 0,
        "y1": 0,
        "x2": 0,
        "y2": 0,
      }
    }]`
    let endpoint = 'processImage'
    let imageDataURLEnd = imageDataURL
    if(imgurl.length) {
      endpoint = 'processImageUrl'
      imageDataURLEnd = imgurl
    }
    setCapturedImages([...capturedImages, imageDataURLEnd]);
    axios.post(`http://127.0.0.1:5000/${endpoint}`, {query:`Assuming width and height of the image as 500px x 500px, idenify all the objects which are clearly visible. I need to draw rectangles enclosing the identified objects, so get the co-ordinates and generate response object in the format : ${responseStructure}.`, url:imageDataURLEnd}).then((res) => {
      console.log(res)
      const responseInArray = res.data.response.replace('json','').split('```')
      const filtered_res = responseInArray.length > 1 ? JSON.parse(responseInArray[1]) : responseInArray
      console.log(filtered_res)
      const fillColors = ['red', 'yellow', 'blue', 'green', 'pink', 'violet', 'grey', 'orange', 'brown', 'cyan']
      const canvas = document.getElementById('myCanvas');
      // const ctx = canvas.getContext('2d');
      filtered_res.items.map((item, index) => {
        const x1 = item["co-ordinates"].x1;
        const y1 = item["co-ordinates"].y1;
        const x2 = item["co-ordinates"].x2;
        const y2 = item["co-ordinates"].y2;
        const color = fillColors[index];

        // Calculate width and height of the rectangle
        const width = x2 - x1;
        const height = y2 - y1;

        // Draw the rectangle
        // ctx.fillStyle = color;
        // ctx.fillRect(x1, y1, width, height);
      })
      setData({...filtered_res})
    })
    // setRecentImage(imageDataURL)
  };

  // Open modal with full-size image
  const openModal = (image) => {
    setModalImage(image);
  };

  // Close modal
  const closeModal = () => {
    setModalImage(null);
  };

  // Swap camera (only for mobile devices)
  const swapCamera = () => {
    setVideoFacingMode(videoFacingMode === 'user' ? 'environment' : 'user');
    if (videoStream) {
      videoStream.getTracks().forEach(track => {
        track.stop();
      });
      initCamera();
    }
  };

  // Initialize camera when component mounts
  React.useEffect(() => {
    initCamera();
    // Cleanup function
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []); // Only run once on mount

  React.useEffect(() => {
    console.log(data)
    if (data.total_objects) {
      console.log(data)
      data.items.map((item) => {
        console.log(item)
      })
    }
  }, [data]);

  return (
    <div>
      <input type='text' placeholder='Image url' value={imgurl} onChange={(e) => setImgUrl(e.target.value)} />
      <video ref={videoRef} autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <br />
      <button onClick={captureImage}>Capture Image</button>
      {capturedImages.length > 0 && (
        <div className="image-grid" style={{'position':'relative'}}>
          {capturedImages.map((image, index) => (
            <img
              key={index}
              src={image}
              width="500"
              height="500"
              alt={`Captured Image ${index}`}
              onClick={() => openModal(image)}
            />
          ))}
          {data?.items?.length && data.items.map((item) => (
              <div style={{'position':'absolute', }}>{item.name}</div>
            ))} 
          <div ></div>
        </div>
      )}
      {/* {modalImage && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" style={{'position':'relative'}}>
            <img src={modalImage} alt="Full Size" />
            {data.items.length && data.items.map((item) => (
              <div style={{'position':'absolute'}}>{item.name}</div>
            ))}
          </div>
        </div>
      )} */}
      {/* Swap camera button for mobile devices */}
      {/(android|iphone|ipad)/i.test(navigator.userAgent) && (
        <button onClick={swapCamera}>Swap Camera</button>
      )}
    </div>
  );
};

export default CameraCapture;
