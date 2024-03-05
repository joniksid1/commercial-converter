import { useState } from 'react';
import axios from 'axios';

function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.pdf')) {
      setError(null);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      // Обработка случая, когда выбран неверный файл
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

      const response = await axios.post('https://api.mixer0000.nomoredomainsmonster.ru/convert', formData, {
        responseType: 'blob',
      });

      // const response = await axios.post('http://localhost:3000/convert', formData, {
      //   responseType: 'blob',
      // });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'downloaded_file.xlsx');
      document.body.appendChild(link);
      link.click();

      setIsLoading(false);
    } catch (error) {
      if (error.response) {
        const blobText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsText(error.response.data);
        });

        const errorMessage = JSON.parse(blobText).message;
        console.log('Сообщение от сервера:', errorMessage);
        setError(errorMessage || 'Произошла ошибка при загрузке файла. Пожалуйста, попробуйте еще раз или обратитесь к администратору..');
      } else {
        console.log('Произошла ошибка:', error.message);
        setError('Произошла ошибка при запросе на сервер. Пожалуйста, попробуйте ещё раз или обратитесь к администратору.');
      }
      setIsLoading(false);
    }
  };

  return (
    <main className='main'>
      <h2 className='main__header'>Загрузите PDF файл</h2>
      {error && <div className='error'>{error}</div>}
      <form className='form' method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
        <label className='form__input-file'>
          <input type="file" name="file" accept=".pdf" onChange={handleFileChange} />
          <span className='form__input-file-btn'>Выберите файл</span>
          <span className='form__input-file-text'>{fileName ? fileName : 'Максимум 10мб'}</span>
        </label>
        <button className='form__button' type="submit" disabled={!file || isLoading}>
          {isLoading ? 'Загрузка...' : 'Сформировать ТКП в XLSX'}
        </button>
      </form>
    </main>
  );
}

export default FileUploadForm;
