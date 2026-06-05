import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

function ProjectPdf({ project, tasks }) {
    const contentRef = useRef(null);

    const handleExport = () => {
        const element = contentRef.current;
        if (!element) return;

        const opt = {
            margin: 10,
            filename: `project-${project.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="pdf-export-container">
            <button onClick={handleExport} className="btn-export">
                📄 Скачать отчет (PDF)
            </button>

            {/* Этот блок будет конвертироваться в PDF */}
            <div ref={contentRef} className="printable-area" style={{ display: 'none' }}> 
            {/* Примечание: display: 'none' скроет блок на странице, но html2pdf все равно сможет его "сфотографировать". 
                Если хочешь видеть превью перед скачиванием, убери display: 'none' */}
                
                <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff' }}>
                    <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                        {project.name}
                    </h1>
                    <p><strong>Описание:</strong> {project.description || 'Нет описания'}</p>
                    <p><strong>Основатель:</strong> {project.owner_name}</p>
                    
                    <h3 style={{ marginTop: '30px' }}>Список задач</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Название</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Статус</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Исполнитель</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks && tasks.map(task => (
                                <tr key={task.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{task.title}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{task.status}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{task.assigned_name || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ marginTop: '40px', fontSize: '10px', color: '#777', textAlign: 'center' }}>
                        Сгенерировано автоматически системой управления проектами
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectPdf;