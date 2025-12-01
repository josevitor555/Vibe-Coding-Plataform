import React from 'react';
import { ProjectTemplate } from '../types';

interface ProjectCardProps {
  project: ProjectTemplate;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-[#0F0F0F] hover:shadow-2xl dark:hover:bg-[#141414] border border-gray-200 dark:border-[#1F1F1F] hover:border-gray-400/50 dark:hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col"
    >
      <div className="h-48 w-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F0F0F] to-transparent z-10 opacity-60" />
        <img 
          src={project.imageUrl} 
          alt={project.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-60 group-hover:opacity-100 dark:group-hover:opacity-80" 
        />
      </div>
      <div className="p-5 flex flex-col flex-grow z-20">
        <h3 className="text-lg font-medium text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-2 truncate">
          {project.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed group-hover:text-black dark:group-hover:text-white transition-colors">
          {project.description}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{project.date}</span>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-black dark:group-hover:bg-white transition-colors" />
        </div>
      </div>
    </div>
  );
};