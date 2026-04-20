import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Peep from 'react-peeps';
import * as ReactDOMServerImport from 'react-dom/server';
import './App.css';

const ReactDOMServer = ReactDOMServerImport.default || ReactDOMServerImport;

// OpenPeeps constants
const STYLES = {
  Peepee: ['One'],
  Bodies: [
    'BlazerBlackTee', 'Shirt', 'ButtonShirt', 'Dress', 'Gaming', 'Geek', 'Hoodie', 'PointingUp', 'Selena', 'Thunder', 'Turtleneck', 'ArmsCrossed', 'Coffee', 'Device', 'DotJacket', 'Explaining', 'FurJacket', 'Killer', 'Paper', 'PocketShirt', 'PoloSweater', 'ShirtCoat', 'ShirtFilled', 'SportyShirt', 'StripedShirt', 'Sweater', 'SweaterDots', 'Whatever',
    'Bike', 'ClosedLegBW', 'ClosedLegWB', 'CrossedLegs', 'HandsBackBW', 'HandsBackWB', 'MediumBW', 'MediumWB', 'OneLegUpBW', 'OneLegUpWB', 'WheelChair',
    'BlazerBW', 'BlazerPantsBW', 'BlazerPantsWB', 'BlazerWB', 'CrossedArmsBW', 'CrossedArmsWB', 'EasingBW', 'EasingWB', 'PointingFingerBW', 'PointingFingerWB', 'PolkaDots', 'RestingBW', 'RestingWB', 'RoboDanceBW', 'RoboDanceOutline', 'RoboDanceWB', 'ShirtBW', 'ShirtPantsBW', 'ShirtPantsWB', 'ShirtWB', 'WalkingBW', 'WalkingFilled', 'WalkingWB', 'Doc', 'DocProtectiveClothe', 'DocStethoscope'
  ],
  Accessory: [
    'None', 'Eyepatch', 'GlassRoundThick', 'SunglassClubmaster', 'SunglassWayfarer', 'GlassAviator', 'GlassButterfly', 'GlassButterflyOutline', 'GlassClubmaster', 'GlassRound'
  ],
  Face: [
    'Angry', 'Blank', 'Calm', 'Cheeky', 'Concerned', 'Contempt', 'Cute', 'Driven', 'EatingHappy', 'EyesClosed', 'OldAged', 'Serious', 'Smile', 'Solemn', 'Suspicious', 'Tired', 'VeryAngry', 'Awe', 'ConcernedFear', 'Cyclops', 'Explaining', 'Fear', 'Hectic', 'LoveGrin', 'LoveGrinTeeth', 'Monster', 'Rage', 'SmileBig', 'SmileLol', 'SmileTeeth', 'CalmNM', 'SmileNM', 'CheersNM'
  ],
  Hair: [
    'Afro', 'Bald', 'BaldSides', 'BaldTop', 'Bangs', 'BangsFilled', 'Bear', 'Bun', 'BunCurly', 'Buns', 'FlatTop', 'FlatTopLong', 'HatHip', 'Long', 'LongAfro', 'LongBangs', 'LongCurly', 'Medium', 'MediumBangs', 'MediumBangsFilled', 'MediumLong', 'MediumShort', 'MediumStraight', 'Mohawk', 'MohawkDino', 'Pomp', 'ShavedRight', 'ShavedSides', 'ShavedWavy', 'Short', 'ShortCurly', 'ShortMessy', 'ShortScratch', 'ShortVolumed', 'ShortWavy', 'BantuKnots', 'Beanie', 'BunFancy', 'CornRows', 'CornRowsFilled', 'GrayBun', 'GrayMedium', 'GrayShort', 'Hijab', 'MediumShade', 'Turban', 'Twists', 'TwistsVolumed', 'DocBouffant', 'DocSurgery', 'DocShield'
  ],
  FacialHair: [
    'None', 'Chin', 'Full', 'FullMajestic', 'FullMedium', 'Goatee', 'GoateeCircle', 'Dali', 'Handlebars', 'Imperial', 'Painters', 'PaintersFilled', 'Swashbuckler', 'MoustacheThin', 'Yosemite', 'GrayFull', 'MajesticHandlebars'
  ],
};

// Colors
const SKIN_COLORS = ['#f4d4ce', '#fcd7b8', '#ffdfbf', '#fdb696', '#ea9b77', '#cb8461', '#915b40', '#633c2a'];
const CLOTHING_COLORS = ['#ff5a5f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#0f172a', '#ffffff', '#000000'];
const BG_COLORS = ['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#e0e7ff', '#fae8ff', '#0f172a'];

export default function App() {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  // Peep State
  const [style, setStyle] = useState('Peepee'); // Default peep type
  const [name, setName] = useState('Hero');
  const [gender, setGender] = useState('Neutral');
  const [body, setBody] = useState('BlazerBlackTee');
  const [face, setFace] = useState('Smile');
  const [hair, setHair] = useState('Short');
  const [accessory, setAccessory] = useState('None');
  const [facialHair, setFacialHair] = useState('None');
  const [skinColor, setSkinColor] = useState('#fcd7b8');
  const [clothingColor, setClothingColor] = useState('#3b82f6');
  
  // App State
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  
  // Gallery & Metadata State
  const [comicTitle, setComicTitle] = useState('My Awesome Comic');
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [frequentCharacters, setFrequentCharacters] = useState([]);

  const fetchFrequentCharacters = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/characters');
      const data = await res.json();
      setFrequentCharacters(data.characters || []);
    } catch (err) {
      console.error('Failed to fetch frequent characters', err);
    }
  };

  useEffect(() => {
    fetchFrequentCharacters();
    // Initialize Fabric Canvas
    const c = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true // Keep objects ordering correct
    });
    
    // Grid Lines for Panels (Optional)
    // You can just draw a line dividing the canvas into panels
    
    c.on('selection:created', (e) => setSelectedObjectId(e.selected[0].id));
    c.on('selection:updated', (e) => setSelectedObjectId(e.selected[0].id));
    c.on('selection:cleared', () => setSelectedObjectId(null));

    setCanvas(c);
    
    // Add default keyboard listeners (delete to remove objects)
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && c.getActiveObjects().length > 0) {
        // Prevent deleting if editing text
        if (c.getActiveObject() && c.getActiveObject().isEditing) return;
        
        c.getActiveObjects().forEach(obj => c.remove(obj));
        c.discardActiveObject();
        c.requestRenderAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      c.dispose();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync background color
  useEffect(() => {
    if (canvas) {
      canvas.setBackgroundColor(bgColor, canvas.renderAll.bind(canvas));
    }
  }, [bgColor, canvas]);

  // Handle adding Peep to Canvas
  const addPeepToCanvas = async () => {
    if (!canvas) return;
    
    try {
      await fetch('http://127.0.0.1:5000/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, face, body, hair, facial_hair: facialHair, accessory, skin_color: skinColor, clothing_color: clothingColor })
      });
      fetchFrequentCharacters();
    } catch (err) {
      console.error('Failed to save character', err);
    }
    
    const peepSvgString = ReactDOMServer.renderToStaticMarkup(
      <Peep
        style={{ width: '300px', height: '300px' }}
        viewBox={{ x: '-10', y: '-10', width: '1050', height: '1200' }}
        body={body}
        face={face}
        hair={hair}
        facialHair={facialHair}
        accessory={accessory}
        backgroundColor={skinColor}
        strokeColor={clothingColor}
      />
    );

    // 2. Load the SVG string into Fabric
    fabric.loadSVGFromString(peepSvgString, (objects, options) => {
      const parentSVG = fabric.util.groupSVGElements(objects, options);
      parentSVG.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: 0.8,
        scaleY: 0.8,
        transparentCorners: false,
        cornerColor: '#6366f1',
        cornerStrokeColor: '#ffffff',
        borderColor: '#6366f1',
        cornerSize: 10,
        id: `peep-${Date.now()}`
      });
      canvas.add(parentSVG);
      canvas.setActiveObject(parentSVG);
      canvas.renderAll();
    });
  };

  // Add Speech Bubble / Text
  const addTextBubble = (type = 'talk') => {
    if (!canvas) return;

    let path = '';
    if (type === 'talk') {
      path = 'M20,0 h80 a20,20 0 0,1 20,20 v40 a20,20 0 0,1 -20,20 h-20 l-20,20 l0,-20 h-40 a20,20 0 0,1 -20,-20 v-40 a20,20 0 0,1 20,-20 z';
    } else if (type === 'think') {
      path = 'M40,20 a15,15 0 0,0 -15,15 a15,15 0 0,0 5,28 a20,20 0 0,0 35,5 a15,15 0 0,0 15,-18 a20,20 0 0,0 -40,-30 z M25,80 a5,5 0 1,1 0,-10 a5,5 0 1,1 0,10 M15,95 a3,3 0 1,1 0,-6 a3,3 0 1,1 0,6';
    } else {
      path = 'M0,0 h120 v60 h-100 z';
    }

    const bubbleShape = new fabric.Path(path, {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      scaleX: 1.5,
      scaleY: 1.5,
      left: 100,
      top: 100
    });

    const text = new fabric.IText(type === 'talk' ? "Type here!" : type === 'think' ? "Thinking..." : "Meanwhile...", {
      fontFamily: 'Comic Neue, cursive',
      fontSize: 18,
      fill: '#000000',
      fontWeight: 'bold',
      left: 140,
      top: 130
    });

    canvas.add(bubbleShape, text);
    canvas.setActiveObject(text);
  };

  const addGridLines = () => {
    // Adds a 3-panel divider line
    const l1 = new fabric.Line([800/3, 0, 800/3, 600], { stroke: 'black', strokeWidth: 4, selectable: false, evented: false });
    const l2 = new fabric.Line([(800/3)*2, 0, (800/3)*2, 600], { stroke: 'black', strokeWidth: 4, selectable: false, evented: false });
    canvas.add(l1, l2);
  };

  const handleLayer = (direction) => {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    if (direction === 'up') canvas.bringForward(obj);
    else if (direction === 'down') canvas.sendBackwards(obj);
    else if (direction === 'front') canvas.bringToFront(obj);
    else if (direction === 'back') canvas.sendToBack(obj);
    canvas.requestRenderAll();
  };

  const downloadCanvas = () => {
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `comiccrafter-${Date.now()}.png`;
    a.click();
  };

  const publishComic = async () => {
    if (!canvas) return;
    setIsSaving(true);
    try {
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.6, multiplier: 0.5 });
      const canvasJson = JSON.stringify(canvas.toJSON());
      
      const res = await fetch('http://127.0.0.1:5000/api/comics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: comicTitle,
          author: 'Anonymous',
          canvas_json: canvasJson,
          preview_base64: dataURL
        })
      });
      if (res.ok) alert("🎉 Comic published to gallery successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save comic to backend.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadGallery = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/comics');
      const data = await res.json();
      setGallery(data.comics || []);
      setShowGallery(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load gallery.");
    }
  };

  const loadComicToCanvas = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/comics/${id}`);
      const data = await res.json();
      if (data.comic && data.comic.canvas_json && canvas) {
        canvas.loadFromJSON(data.comic.canvas_json, () => {
          canvas.renderAll();
          setComicTitle(data.comic.title);
          setShowGallery(false);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      {/* ── GALLERY MODAL ──────────────────────────────────── */}
      {showGallery && (
        <div style={{ position:'absolute', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.8)', zIndex: 100, display:'flex', flexDirection:'column', alignItems:'center', padding: 40 }}>
          <div style={{ width: '100%', maxWidth: 1000, display:'flex', justifyContent:'space-between', marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontFamily:'Comic Neue' }}>Community Gallery</h2>
            <button className="btn-secondary" onClick={() => setShowGallery(false)}>Close Gallery</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, width: '100%', maxWidth: 1000, overflowY: 'auto' }}>
            {gallery.length === 0 && <p style={{ color: 'white' }}>No comics published yet!</p>}
            {gallery.map(c => (
              <div key={c.comic_id} onClick={() => loadComicToCanvas(c.comic_id)} style={{ background: 'white', padding: 12, borderRadius: 12, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                <img src={c.preview_base64} alt={c.title} style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <h4 style={{ marginTop: 12, fontSize: '1rem' }}>{c.title}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>By {c.author} • {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🦸‍♂️ ComicCrafter</h1>
          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={loadGallery}>Gallery</button>
        </div>

        <div className="sidebar-content">
          <div className="peep-preview">
            <Peep
              style={{ width: '220px', height: '220px' }}
              viewBox={{ x: '-10', y: '-10', width: '1050', height: '1200' }}
              body={body}
              face={face}
              hair={hair}
              facialHair={facialHair}
              accessory={accessory}
              backgroundColor={skinColor}
              strokeColor={clothingColor}
            />
          </div>

          <button className="btn-primary" onClick={addPeepToCanvas}>
            ➕ Add Character to Comic
          </button>

          <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

          <p className="section-title">Character Builder</p>
          
          <div className="control-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Character Name" />
          </div>

          <div className="control-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Neutral">Neutral</option>
            </select>
          </div>

          
          <div className="control-group">
            <label>Face (Expression)</label>
            <select value={face} onChange={(e) => setFace(e.target.value)}>
              {STYLES.Face.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="control-group">
            <label>Body / Pose</label>
            <select value={body} onChange={(e) => setBody(e.target.value)}>
              {STYLES.Bodies.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="control-group">
            <label>Hair</label>
            <select value={hair} onChange={(e) => setHair(e.target.value)}>
              {STYLES.Hair.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="control-group">
            <label>Accessories</label>
            <select value={accessory} onChange={(e) => setAccessory(e.target.value)}>
              {STYLES.Accessory.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="control-group">
              <label>Skin Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {SKIN_COLORS.map(c => (
                  <div key={c} onClick={() => setSkinColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: c === skinColor ? '2px solid #6366f1' : '1px solid #cbd5e1', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div className="control-group">
              <label>Outfit Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {CLOTHING_COLORS.map(c => (
                  <div key={c} onClick={() => setClothingColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: c === clothingColor ? '2px solid #6366f1' : '1px solid #cbd5e1', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
          
          <p className="section-title">Frequently Used</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {frequentCharacters.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No characters yet.</p>}
            {frequentCharacters.map(c => (
              <div key={c.id} className="recent-char-card" onClick={() => {
                setName(c.name);
                setGender(c.gender);
                setFace(c.face);
                setBody(c.body);
                setHair(c.hair);
                setFacialHair(c.facial_hair);
                setAccessory(c.accessory);
                setSkinColor(c.skin_color);
                setClothingColor(c.clothing_color);
              }}>
                <div className="recent-char-icon">
                  <Peep
                    style={{ width: '40px', height: '40px' }}
                    viewBox={{ x: '-10', y: '-10', width: '1050', height: '1200' }}
                    body={c.body} face={c.face} hair={c.hair} facialHair={c.facial_hair} accessory={c.accessory} backgroundColor={c.skin_color} strokeColor={c.clothing_color}
                  />
                </div>
                <div className="recent-char-info">
                  <h4>{c.name}</h4>
                  <p>{c.usage_count} usage{c.usage_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
          
          <p className="section-title">Props & Comic Assets</p>
          
          <div className="shout-preset">
             <div className="bubble-card" onClick={() => addTextBubble('talk')}>
               <span style={{ fontSize: 24 }}>💬</span>
               <span>Speech</span>
             </div>
             <div className="bubble-card" onClick={() => addTextBubble('think')}>
               <span style={{ fontSize: 24 }}>💭</span>
               <span>Think</span>
             </div>
             <div className="bubble-card" onClick={() => addTextBubble('caption')}>
               <span style={{ fontSize: 24 }}>🔲</span>
               <span>Caption</span>
             </div>
          </div>

        </div>
      </aside>

      {/* ── EDITOR AREA ──────────────────────────────────── */}
      <main className="editor-wrapper">
        <header className="editor-toolbar">
          <div className="toolbar-group">
            <input 
              type="text" 
              value={comicTitle} 
              onChange={e => setComicTitle(e.target.value)} 
              style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Comic Neue, cursive', border: 'none', background: 'transparent', outline: 'none', borderBottom: '2px dashed #cbd5e1', width: 200, marginRight: 16 }} 
              placeholder="Comic Title"
            />
            
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginRight: 8 }}>Canvas:</span>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {BG_COLORS.map(c => (
                <div key={c} onClick={() => setBgColor(c)} style={{ width: 24, height: 24, borderRadius: 4, background: c, border: c === bgColor ? '2px solid #6366f1' : '1px solid #cbd5e1', cursor: 'pointer' }} />
              ))}
            </div>

            <button className="btn-secondary" style={{ marginLeft: 16 }} onClick={addGridLines}>
              ◫ Add 3-Panel Grid
            </button>
          </div>

          <div className="toolbar-group">
             <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Layers:</span>
             <button className="icon-btn" onClick={() => handleLayer('front')} title="Bring to Front">⏫</button>
             <button className="icon-btn" onClick={() => handleLayer('up')} title="Bring Forward">🔼</button>
             <button className="icon-btn" onClick={() => handleLayer('down')} title="Send Backward">🔽</button>
             <button className="icon-btn" onClick={() => handleLayer('back')} title="Send to Back">⏬</button>
          </div>

          <div className="toolbar-group">
            <button className="btn-secondary" onClick={downloadCanvas}>
              ⬇️ Export PNG
            </button>
            <button className="btn-primary" onClick={publishComic} disabled={isSaving}>
              {isSaving ? '⏳ Saving...' : '🌍 Publish Comic'}
            </button>
          </div>
        </header>

        <div className="canvas-container-outer">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} />
          </div>
          <p style={{ position: 'absolute', bottom: 20, right: 40, fontSize: '0.8rem', color: '#94a3b8' }}>
            Hint: Select objects and press Delete/Backspace to remove them. Double click text to edit.
          </p>
        </div>
      </main>
    </div>
  );
}
