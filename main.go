package main

import (
	"log"
	"math/rand"
	"net/http"
	"overseerr/models"

	"github.com/gin-gonic/gin"
	gossr "github.com/natewong1313/go-react-ssr"
)

func main() {
	engine, err := gossr.New(gossr.Config{
		AssetRoute:         "./src/assets",
		FrontendDir:        "./src",
		GeneratedTypesPath: "./src/generated.d.ts",
		PropsStructsPath:   "./models/props.go",
		// TailwindConfigPath: "./tailwind.config.js",
	})

	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		renderedResponse := engine.RenderRoute(gossr.RenderConfig{
			File:  "pages/_document.tsx",
			Title: "Pages app",
			MetaTags: map[string]string{
				"og:title":    "Example app",
				"description": "Hello world!",
			},
			Props: &models.IndexRouteProps{
				InitialCount: rand.Intn(100),
			},
		})
		c.Writer.Write(renderedResponse)
	})
	r.Run()

	_, err = http.Get("https://google.com")
	if err != nil {
		log.Printf("Cant connect")
		log.Print(err)
	}
}
