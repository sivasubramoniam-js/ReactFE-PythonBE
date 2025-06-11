import { Box, IconButton } from "@mui/material";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useState, useRef, useEffect } from 'react';
import ImageResize from 'quill-image-resize-module-react';
import Quill from 'quill';
import html2pdf from 'html2pdf.js';
import { useExportToDoc } from 'html-to-doc-react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import "./Editor.scss"

window.Quill = Quill;
Quill.register('modules/imageResize', ImageResize);

const modules = {
  toolbar: [
    [{ 'header': '1'}, { 'header': '2'}, { 'header': [3, 4,] } ],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['image', 'link', 'video', 'blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    ['clean']
  ],
  imageResize: {
    parchment: Quill.import('parchment'),
    modules: ['Resize', 'DisplaySize', 'Toolbar']
  }
};

const Editor = ({ handleSelection, editorRef, setCursorPosition }) => {
  const [content, setContent] = useState("");
  const quillRef = editorRef;
  const mounted = useRef(false);
  
  const handleBlur = (e) => {
    setCursorPosition(e.index)
  };

  const html2doc = useExportToDoc(quillRef?.current?.editor.container.outerHTML, null, "document.doc");

  const previewPdf = () => {
    let contentHtml = quillRef.current.editor.container;
    contentHtml.style.border = "none";
    const editorHeight = contentHtml.style.height;
    contentHtml.style.height = "";
    html2pdf().from(contentHtml)
        .set({
            margin: [20, 20, 20, 20],
            // jsPDF:        { format: 'letter', orientation: 'portrait' }
        })
        .toPdf()
        .get('pdf')
        .then(function (pdf) {
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            contentHtml.style.border = "";
            contentHtml.style.height = editorHeight;
            window.open(url, '_blank');
        });
  };

  const downloadPdf = () => {
    let contentHtml = quillRef.current.editor.container;
    contentHtml.style.border = "none";
    html2pdf().from(contentHtml).set({
      margin: [20, 20, 20, 20]
  })
  .toPdf()
  .get('pdf').save('document.pdf');
  };

  useEffect(() => {
    const quill = quillRef.current.getEditor();
    if (!mounted.current){
    quill.root.addEventListener("paste", async (event) => {
      const clipboardData = event.clipboardData;
      if (clipboardData && clipboardData.items) {
          for (const item of clipboardData.items) {
          console.log(item);
          if (item.type.indexOf("image") !== -1) {
            event.preventDefault();
            console.log(clipboardData);
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Image = e.target.result;
              const range = quill.getSelection();
              quill.insertEmbed(range.index, "image", base64Image);
            };
            reader.readAsDataURL(file);
          }
        }
      }})
    mounted.current = true;
    }
  }, []);

  return (
    <Box sx={{ px: 2, m: 0 }}>
      <Box sx={{ m: 0, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'}}>
          <Box sx={{ display: 'flex', gap: 1}}>
            <IconButton onClick={downloadPdf} style={{ background: "transparent", color: "black"}}>
              <img style={{width:"25px"}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACIklEQVR4nO3Xz0sUYRzH8flX/EWidkihgymeBDt4dbRskTLBxENkIBGUEGR2i4oQC0IXL+IhCnQR0VsImh6ENsNCyeUxYoksf637jseHddLFIvN5dh96PjDM7GHh+5r5PvN9xvNcXPQGPxctR11Ot7WAZOsZcwg0ALbfzpK8UmEGoQUgYuYQ6AKYQqATIAwgtAOEZoQRgNCIMAYQmhBGAUIDwjhA7EdkJeBvDs8BfPcEsK+F7oRgZRF+rEG420LAlxh7Se5Aa7lFgEulQfHzr9W557JFgPMnYCehCl9+ZyHAz4UP80H7yHTWWgYI3wvaKJGAULFlgOYy2NpQgPdzRy6ejE7imXEFiE5DfZ5lgIYCiK8GbdR308JBJrO9tXvaHWjtVRYBJoZU4cMPYSqirmMfoeW0BYDmMtj4rmZBWyVcPAXLCwqx8EY9nWe3YeQ5jA1CJAyPrsG5giwBDD1QxcpFLH931EBkgD9mcjgLAE0n4VtcFRSdAbG0v8jUmkhlZRGWoup6cz3DALmFeNmXfmdl+7zoha4GaCxUQ04u6oOZncwQoD4fem/A509BMbJA2d+HbSHkhu9xB7x6CqP96v+hkgwArlarhflr5OSVrXSUt5dvEnCrDta+pvf49bPHVjzaAHLSplomLoJd5+D9Yy0ebYALRelvFDm8/mHPg/EWetKp7r78fOy/e+ggyl6Ab+bwHMB3TwDXQv91C7m4eL/NT9rWaYTkzttuAAAAAElFTkSuQmCC" alt="pdf" />
            </IconButton>
            <IconButton onClick={html2doc} style={{ background: "transparent", color: "black"}}>
            <img style={{width:"25px"}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACOElEQVR4nO2ZQWgTQRSGh+DFq70VD2lvQuKpV714cGtLu3ioiiJeWr0oaSnSm0KhKnabJiKYYhHRQxORBmLqoYVKqaGGWmizAYsaCBhDpdCkqatpap68l3QO4kHJsBnN/PDDzts34f+YN3sJY0pKSkr/pFz31q64/Ym822+CPU7kXX7zsjAAe8ObZJfPzAkEsDe8u2oFsC91An41Qv/rCGmGh2nGDtMMqMWOznFoHpipC8BOreE5RMc4uIdNoWZ/AAAirQCGG/kEjg8GARVZ+shrR3ofwb5ODD3j9Wg8RTXcIw3AwS4ffN/dgy85i9f6fLMc4MaTGK9vbH2lXtwjDQDTDHidzFDYlksPaf14LgnFUgVqdiVNNXyHwl6pRohpBtwJxSncmZEXtE5lc7D07jNMx95DwdqFAx1eOHc7Sj3YKx1A180whTOeL0Pz+QA9e6ffwvXJBXpuu/qU1ijslQ6gqec+lMsAi8kMnQKqZyQCxwan6NnzYJ5GB3uw99f9Rz1vhJr9LQA6md6Eb8USBGZWKfThCxN0WfEuhGMfwCqWqOd3e6UACFSDb1tF+LRZ4PX4ehZKez/oHfZIC3Dx7kv+6QwtrPO6L7zC69gjLUBr9TOJ6g+84vWztyp3AoU90gKwGqwAPI13AqMFUeEdp7x1ADhpXBMB4WgfKx/qnLRaT4e2RJqJUosehHqYKYCq1AnoaoQafIScejBvd3hn95S4PziceqgPf9DO8E492CsMQElJSYmJ0E+635eFCoKREwAAAABJRU5ErkJggg==" alt="microsoft-word-2019--v2"></img>
            </IconButton>
            <IconButton onClick={previewPdf} style={{ background: "transparent", color: "black"}}>
              <VisibilityIcon style={{ color: "lightgray" }} />
            </IconButton>
          </Box>
      </Box>
      <Box style={{ border: "1px solid #ccc"}}>
        <>
        <ReactQuill 
          className="quill-editor"
          ref={quillRef}
          value={content} 
          onChange={setContent} 
          modules={modules} 
          onChangeSelection={(range, source, editor) => {
            console.log(range, source, editor);
            console.log(editor.getHTML());
            if(range?.length) {
            handleSelection(editor.getText(),{ start: range.index, len: range.length });
            }
            setCursorPosition(range?.index || 0);
          }}
          onBlur={handleBlur}
        />
        </>
      </Box>
    </Box>
  );
};

export default Editor;
