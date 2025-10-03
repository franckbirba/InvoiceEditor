import * as React from 'react';

interface InlineEditableFieldProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'textarea';
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function InlineEditableField({
  value,
  onChange,
  type = 'text',
  className = '',
  placeholder = 'Cliquer pour éditer',
  multiline = false,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(String(value || ''));
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(String(value || ''));
      setIsEditing(false);
    }
  };

  const displayValue = value || placeholder;
  const isEmpty = !value;

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: `${className} border-2 border-blue-500 bg-white px-2 py-1 focus:outline-none`,
      style: { minWidth: '100px' },
    };

    if (multiline || type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={3}
          className={`${commonProps.className} resize-none`}
        />
      );
    }

    return <input {...commonProps} type={type} />;
  }

  return (
    <span
      onClick={() => {
        setEditValue(String(value || ''));
        setIsEditing(true);
      }}
      className={`${className} cursor-pointer hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 transition-all px-2 py-1 inline-block min-w-[60px] ${
        isEmpty ? 'text-gray-400 italic' : ''
      }`}
      title="Cliquer pour éditer"
    >
      {displayValue}
    </span>
  );
}
