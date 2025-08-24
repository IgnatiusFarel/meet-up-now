import { useState, useEffect, useRef, useCallback } from 'react';

const useActiveSection = (sectionIds) => {
  const [activeSection, setActiveSection] = useState('home');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const scrollTimeoutRef = useRef(null);

  // Simplified and more reliable position-based detection
  const getCurrentSection = useCallback(() => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    console.log('getCurrentSection called - scrollY:', scrollY);
    
    // If we're at the very top, always return home
    if (scrollY <= 100) {
      console.log('At top - returning home');
      return { section: 'home', index: 0 };
    }
    
    // Calculate center of viewport
    const viewportCenter = scrollY + (viewportHeight / 2);
    
    // Find which section the viewport center is currently in
    for (let i = 0; i < sectionIds.length; i++) {
      const sectionId = sectionIds[i];
      const element = document.getElementById(sectionId);
      
      if (!element) {
        console.log(`Element ${sectionId} not found`);
        continue;
      }
      
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.offsetHeight;
      
      console.log(`Checking ${sectionId}:`, {
        elementTop,
        elementBottom,
        viewportCenter,
        scrollY,
        inRange: viewportCenter >= elementTop && viewportCenter < elementBottom
      });
      
      // Check if viewport center is within this section
      if (viewportCenter >= elementTop && viewportCenter < elementBottom) {
        console.log(`Found active section: ${sectionId} (index: ${i})`);
        return { section: sectionId, index: i };
      }
    }
    
    // Fallback: if viewport center doesn't hit any section, find the closest one
    let closestSection = 'home';
    let closestIndex = 0;
    let minDistance = Infinity;
    
    sectionIds.forEach((sectionId, index) => {
      const element = document.getElementById(sectionId);
      if (!element) return;
      
      const elementTop = element.offsetTop;
      const elementCenter = elementTop + (element.offsetHeight / 2);
      const distance = Math.abs(viewportCenter - elementCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSection = sectionId;
        closestIndex = index;
      }
    });
    
    console.log(`Fallback - closest section: ${closestSection} (index: ${closestIndex})`);
    return { section: closestSection, index: closestIndex };
  }, [sectionIds]);

  // Update active section
  const updateActiveSection = useCallback((newSection, newIndex, source = 'unknown') => {
    if (newSection !== activeSection || newIndex !== activeSectionIndex) {
      console.log(`[${source}] Updating section from "${activeSection}" (${activeSectionIndex}) to "${newSection}" (${newIndex})`);
      setActiveSection(newSection);
      setActiveSectionIndex(newIndex);
    }
  }, [activeSection, activeSectionIndex]);

  // Handle scroll with debouncing
  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const scrollY = window.scrollY;
    
    // Immediate check for very top of page
    if (scrollY <= 100) {
      if (activeSection !== 'home') {
        console.log('Immediate update to home - scrollY:', scrollY);
        updateActiveSection('home', 0, 'scroll-top-immediate');
      }
      return;
    }

    // Debounced check for other positions
    scrollTimeoutRef.current = setTimeout(() => {
      const current = getCurrentSection();
      updateActiveSection(current.section, current.index, 'scroll-debounced');
    }, 100);
  }, [getCurrentSection, updateActiveSection, activeSection]);

  useEffect(() => {
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    const initialTimeout = setTimeout(() => {
      const current = getCurrentSection();
      updateActiveSection(current.section, current.index, 'initial-check');
    }, 200);

    return () => {
      clearTimeout(initialTimeout);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, getCurrentSection, updateActiveSection]);

  return { activeSection, activeSectionIndex };
};

export default useActiveSection;