import React, { useState, useEffect } from 'react';
import { blogFrontmatterSchema } from '../utils/schema';

export default function MetadataForm({ data, onChange }) {
  const [errors, setErrors] = useState({});
  const [tagsStr, setTagsStr] = useState((data.tags || []).join(', '));

  useEffect(() => {
    try {
      blogFrontmatterSchema.parse(data);
      setErrors({});
    } catch (error) {
      if (error.errors) {
        const newErrors = {};
        error.errors.forEach(err => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tags') {
      setTagsStr(value);
      onChange({ ...data, [name]: value.split(',').map(t => t.trim()).filter(Boolean) });
    } else {
      onChange({ ...data, [name]: value });
    }
  };

  return (
    <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Post Settings</h2>
      
      <div className="form-group">
        <label>Title</label>
        <input type="text" name="title" value={data.title} onChange={handleChange} placeholder="e.g. Building Scalable RAG" />
        {errors.title && <span className="error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label>Date</label>
        <input type="text" name="date" value={data.date} onChange={handleChange} placeholder="e.g. Sep 05, 2025" />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      <div className="form-group">
        <label>Read Time</label>
        <input type="text" name="readTime" value={data.readTime} onChange={handleChange} placeholder="e.g. 8 min read" />
        {errors.readTime && <span className="error">{errors.readTime}</span>}
      </div>

      <div className="form-group">
        <label>Summary</label>
        <textarea name="summary" value={data.summary || ''} onChange={handleChange} rows={3} placeholder="Short excerpt..." />
      </div>

      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value={tagsStr} onChange={handleChange} placeholder="AI, React, Vite" />
      </div>
      
      {/* TOC will be injected here by App layout if needed, or we can just leave it to App */}
    </div>
  );
}
