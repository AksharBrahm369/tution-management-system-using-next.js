'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Mail, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Teacher {
  id: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  employmentType: string;
  subjects: { subject: { name: string } }[];
}

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data?.teachers ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.teacherCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Teachers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage teaching staff and assignments</p>
        </div>
        <Link href="/admin/teachers/add">
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all text-sm font-medium">
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            aria-label="Search teachers"
            type="text"
            placeholder="Search teachers by name, code or email..." 
            className="w-full pl-9 pr-4 py-2 rounded-md border bg-white text-slate-900 dark:text-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all">
          <Filter className="h-4 w-4 text-slate-500" />
          Filters
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 h-64"></div>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No teachers found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            We couldn't find any teachers matching your search criteria. Try adjusting your filters or add a new teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
              {/* Card top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                    {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">
                      {teacher.teacherCode}
                    </p>
                  </div>
                </div>
                <button type="button" aria-label={`Open actions for ${teacher.firstName} ${teacher.lastName}`} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 mr-2 opacity-70" />
                  <span className="line-clamp-1">{teacher.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 mr-2 opacity-70" />
                  <span>{teacher.phone}</span>
                </div>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                  <p className="text-xs text-slate-500 mb-2 font-medium">SUBJECTS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.map((sub, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                        {sub.subject.name}
                      </span>
                    ))}
                    {teacher.subjects.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    teacher.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    teacher.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {teacher.status}
                  </span>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                    {teacher.employmentType.replace('_', ' ')}
                  </span>
                </div>
                
                <Link href={`/admin/teachers/${teacher.id}`}>
                  <button className="px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all -mr-2">
                    View Profile
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
