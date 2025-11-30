import React from 'react';
import { ProjectTemplate } from '../types';

interface ProjectCardProps {
  project: ProjectTemplate;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="group relative bg-white dark:bg-[#0F0F0F] hover:shadow-xl dark:hover:bg-[#141414] border border-gray-200 dark:border-[#1F1F1F] hover:border-purple-500/30 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col">
      <div className="h-32 w-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F0F0F] to-transparent z-10 opacity-60" />
        <img 
          src={project.imageUrl} 
          alt={project.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-60 group-hover:opacity-100 dark:group-hover:opacity-80" 
        />
      </div>
      <div className="p-4 flex flex-col flex-grow z-20">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors mb-1 truncate">
          {project.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-3">
          {project.description}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{project.date}</span>
          <div className="w-2 h-2 rounded-full bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};