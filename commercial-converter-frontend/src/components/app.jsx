import { useState, useEffect } from 'react';
import axios from 'axios';

function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const handleDocumentDragOver = (event) => {
      event.preventDefault();
      setDragOver(true);
    };

    const handleDocumentDragLeave = (event) => {
      event.preventDefault();
      setDragOver(false);
    };

    const handleDocumentDrop = (event) => {
      event.preventDefault();
      setDragOver(false);
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith('.pdf')) {
        setError(null);
        setFile(droppedFile);
        setFileName(droppedFile.name);
      } else {
        setError('Пожалуйста, перетащите файл в формате PDF');
        setFile(null);
        setFileName('');
      }
    };

    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('dragleave', handleDocumentDragLeave);
    document.addEventListener('drop', handleDocumentDrop);

    return () => {
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
      document.removeEventListener('drop', handleDocumentDrop);
    };
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.pdf')) {
      setError(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setError('Пожалуйста, выберите файл в формате PDF');
      setFile(null);
      setFileName('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      // Для локального теста
      // const response = await axios.post('http://localhost:3000/api/convert', formData, {
      //   responseType: 'blob',
      // });

      const response = await axios.post('http://192.168.97.110:8080/api/convert', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'downloaded_file.xlsx');
      document.body.appendChild(link);
      link.click();

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (error.response) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const errorMessage = JSON.parse(reader.result).message;
            setError(errorMessage || 'Произошла ошибка при загрузке файла. Пожалуйста, попробуйте еще раз или обратитесь к администратору.');
          } catch {
            setError('Ошибка сервера, попробуйте ещё раз.');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        console.log('Произошла ошибка:', error.message);
        setError('Произошла ошибка при запросе на сервер. Пожалуйста, попробуйте ещё раз или обратитесь к администратору.');
      }
    }
  };

  return (
    <main className={`main ${dragOver ? 'drag-over' : ''}`}>
      <div className={`drag-over-overlay ${dragOver ? 'visible' : ''}`}></div>
      <h2 className='main__header'>Загрузите или перетащите PDF файл</h2>
      {error && <div className='error'>{error}</div>}
      <form className='form' method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
        <label className='form__input-file'>
          <input type="file" name="file" accept=".pdf" onChange={handleFileChange} />
          <span className='form__input-file-btn'>Загрузить PDF файл</span>
          <span className='form__input-file-text'>{fileName ? fileName : 'Максимум 10 МБ'}</span>
        </label>
        <button className='form__button' type="submit" disabled={!file || isLoading}>
          {isLoading ? 'Загрузка...' : 'Сформировать ТКП в XLSX'}
        </button>
      </form>
    </main>
  );
}

export default FileUploadForm;
