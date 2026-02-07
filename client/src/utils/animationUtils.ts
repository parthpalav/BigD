// GSAP animation utilities for ORION Traffic Intelligence Platform

import gsap from 'gsap';

/**
 * Animate route drawing on map
 */
export const animateRouteDraw = (
    element: HTMLElement | null,
    duration: number = 1.5,
    onComplete?: () => void
) => {
    if (!element) return;

    gsap.fromTo(
        element,
        {
            strokeDashoffset: 1000,
            strokeDasharray: 1000,
        },
        {
            strokeDashoffset: 0,
            duration,
            ease: 'power2.inOut',
            onComplete,
        }
    );
};

/**
 * Camera movement easing function
 */
export const cameraEasing = (t: number): number => {
    // Custom easing for smooth camera movements
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Animate insight cards reveal
 */
export const animateInsightCards = (
    elements: HTMLElement[],
    stagger: number = 0.1
) => {
    gsap.fromTo(
        elements,
        {
            opacity: 0,
            y: 30,
            scale: 0.95,
        },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger,
            ease: 'power3.out',
        }
    );
};

/**
 * Animate timeline scrubber
 */
export const animateTimelineScrubber = (
    element: HTMLElement,
    position: number,
    duration: number = 0.3
) => {
    gsap.to(element, {
        left: `${position}%`,
        duration,
        ease: 'power2.out',
    });
};

/**
 * Pulse animation for markers
 */
export const pulseMarker = (element: HTMLElement) => {
    gsap.to(element, {
        scale: 1.2,
        opacity: 0.7,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
    });
};

/**
 * Fade in animation
 */
export const fadeIn = (
    element: HTMLElement | HTMLElement[],
    duration: number = 0.5,
    delay: number = 0
) => {
    gsap.fromTo(
        element,
        { opacity: 0 },
        {
            opacity: 1,
            duration,
            delay,
            ease: 'power2.out',
        }
    );
};

/**
 * Slide in from left animation
 */
export const slideInLeft = (
    element: HTMLElement,
    duration: number = 0.6,
    delay: number = 0
) => {
    gsap.fromTo(
        element,
        {
            x: -100,
            opacity: 0,
        },
        {
            x: 0,
            opacity: 1,
            duration,
            delay,
            ease: 'power3.out',
        }
    );
};

/**
 * Slide in from right animation
 */
export const slideInRight = (
    element: HTMLElement,
    duration: number = 0.6,
    delay: number = 0
) => {
    gsap.fromTo(
        element,
        {
            x: 100,
            opacity: 0,
        },
        {
            x: 0,
            opacity: 1,
            duration,
            delay,
            ease: 'power3.out',
        }
    );
};

/**
 * Number counter animation
 */
export const animateNumber = (
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 1,
    suffix: string = ''
) => {
    const obj = { value: from };

    gsap.to(obj, {
        value: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
            element.textContent = Math.round(obj.value) + suffix;
        },
    });
};

/**
 * Stagger fade in for list items
 */
export const staggerFadeIn = (
    elements: HTMLElement[],
    stagger: number = 0.1,
    duration: number = 0.5
) => {
    gsap.fromTo(
        elements,
        {
            opacity: 0,
            y: 20,
        },
        {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: 'power2.out',
        }
    );
};
