import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TaskFiles.css';

function TaskFiles({ taskId }) {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isFilesOpen, setIsFilesOpen] = useState(false);

    useEffect(() => {
        console.log("Загружаем файлы для taskId:", taskId);
        if (taskId) fetchFiles();
    }, [taskId]);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/tasks/${taskId}/files`);

            const data = Array.isArray(res.data) ? res.data : (res.data.files || []);

            setFiles(res.data);
        } catch (err) {
            console.error("Ошибка загрузки файлов:", err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await api.post(`/tasks/${taskId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            setSelectedFile(null);
            document.getElementById('file-input').value = null;
            fetchFiles();
        } catch (err) {
            alert(err.response?.data?.error || "Ошибка при загрузке");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = async () => {
        setSelectedFile(null);
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.value = null;
        }
        fetchFiles();
    };

    const handleDelete = async (fileId) => {
        if (!window.confirm("Удалить этот файл?")) return;
        try {
            await api.delete(`/tasks/files/${fileId}`);
            fetchFiles();
        } catch (err) {
            console.error("Ошибка при удалении");
        }
    };

    const openTaskFiles = async () => {
        setIsFilesOpen(true);
    }

    return (
        <div className="task-files-container">
            <button className="btn-toggle-files" onClick={() => setIsFilesOpen(!isFilesOpen)}>
                {isFilesOpen ? "Скрыть вложения" : `Вложения (${files.length})`}
            </button>

            {isFilesOpen && (
                <div className="files-content-wrapper">
                    <div className="files-list">
                        {files.length === 0 ? (
                            <p className="no-files">Нет прикрепленных файлов</p>
                        ) : (
                            files.map((file) => (
                                <div key={file.id} className="file-item">
                                    <a 
                                        href={`http://localhost:3000/uploads/${file.filename}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="file-link"
                                    >
                                        {file.filename}
                                    </a>
                                    <button 
                                        className="btn-file-del" 
                                        onClick={() => handleDelete(file.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
        
                    <div className="file-upload-form">
                        <input
                            id="file-input"
                            type="file"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <button
                            className="btn-upload"
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                        >
                            {isUploading ? 'Загрузка...' : 'Загрузить'}
                        </button>
                        <button
                            className={selectedFile ? "btn-cancel show" : "btn-cancel noshow"}
                            onClick={handleCancel}
                            disabled={!selectedFile || isUploading}
                        >
                            Отменить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskFiles;