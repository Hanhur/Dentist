const swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    breakpoints: {
        // 630: {
        //     slidesPerView: 1,
        //     spaceBetween: 20,
        // },
        // 700: {
        //     slidesPerView: 2,
        //     spaceBetween: 20,
        // },
        // 820: {
        //     slidesPerView: 2,
        //     spaceBetween: 20,
        // },
        // 1000: {
        //     slidesPerView: 1,
        //     spaceBetween: 20,
        // },
        // 1135: {
        //     slidesPerView: 1,
        //     spaceBetween: 20,
        // },
    },
});