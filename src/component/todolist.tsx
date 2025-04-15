'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
      }));
      setTasks(tasksData);
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return '⏳ Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `⏳ ${hours} jam ${minutes} menit ${seconds} detik`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: '✨ Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="📝 Tugas yang perlu dikerjakan">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '✅ Tambah',
      cancelButtonText: '❌ Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);

      // ✅ Pop-up setelah berhasil menambahkan tugas
      await Swal.fire({
        icon: 'success',
        title: 'Tugas berhasil ditambahkan!',
        text: `📝 ${newTask.text}`,
        confirmButtonText: 'Oke 👍',
        timer: 2000,
        timerProgressBar: true,
      });
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: '✨ Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="📝 Tugas yang perlu dikerjakan">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '💾 Simpan',
      cancelButtonText: '❌ Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask: Task = {
        ...task,
        text: formValues[0],
        deadline: formValues[1],
      };

      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom right, #FFB6C1, #FFDAB9, #FFE4B5, #FFBCB3)',
      }}
    >
      <div className="max-w-md w-full p-6 bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl border border-orange-200">
        <h1 className="text-3xl text-orange-600 font-bold mb-6 text-center tracking-wide">
          🌼To-Do List 🌼
        </h1>
        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-gradient-to-r from-pink-300 to-orange-300 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:scale-105 transition-transform duration-200"
          >
            ➕ Tambah Tugas
          </button>
        </div>
        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = timeRemaining[task.id] || '⏳ Menghitung...';
              const isExpired = timeLeft.includes('habis');
              const taskColor = task.completed
                ? 'bg-green-100'
                : isExpired
                ? 'bg-red-100'
                : 'bg-yellow-50';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl shadow-sm ${taskColor} border border-gray-200`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800 font-medium'
                      }`}
                    >
                      🌟 {task.text}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(task)}
                        className="bg-gradient-to-r from-yellow-300 to-yellow-400 text-gray-800 font-medium px-3 py-1 rounded-md shadow hover:scale-105 transition-transform text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-gradient-to-r from-red-400 to-rose-500 text-white font-medium px-3 py-1 rounded-full shadow-md hover:scale-105 transition-transform text-sm"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    📅 Deadline: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs font-medium text-gray-600">{timeLeft}</p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
