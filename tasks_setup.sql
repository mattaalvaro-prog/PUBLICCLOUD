-- Setup for Task Management (TAR) Kanban Board

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id BIGINT REFERENCES public.cliente_proy(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, TO DO, DOING, ON-HOLD, TESTING, DONE, CLOSED
    phase TEXT DEFAULT 'Discover', -- Discover, Preparar, Explorar, Realizar, Desplegar, Ejecutar
    assigned_to TEXT REFERENCES public.users(email) ON DELETE SET NULL,
    color TEXT DEFAULT '#3498db', -- Default SAP Blue variant
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Task Comments Table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sample tasks for testing (optional, can be done via app)
-- INSERT INTO public.tasks (project_id, title, description, status, priority)
-- VALUES (1, 'Configuración inicial', 'Configurar el entorno de desarrollo', 'OPEN', 'High');
