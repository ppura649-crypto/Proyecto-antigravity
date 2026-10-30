// Face geometry for a talking-head frame, via macOS Vision (no pip installs).
// Usage: measure_face <image.png> [...]   -> one JSON line per image, fractions of H/W, origin TOP-LEFT
//   {"file":..., "w":.., "h":.., "face":{"top":..,"bottom":..,"left":..,"right":..},
//    "eyes":y, "nose":y, "mouth":y, "chin":y, "confidence":..}
import Foundation
import Vision
import AppKit

func measure(_ path: String) -> String {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        return "{\"file\":\"\(path)\",\"error\":\"cannot read\"}"
    }
    let W = cg.width, H = cg.height
    let req = VNDetectFaceLandmarksRequest()
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([req]) } catch { return "{\"file\":\"\(path)\",\"error\":\"\(error)\"}" }
    guard let faces = req.results, let f = faces.max(by: { $0.boundingBox.width < $1.boundingBox.width }) else {
        return "{\"file\":\"\(path)\",\"w\":\(W),\"h\":\(H),\"error\":\"no face\"}"
    }
    let bb = f.boundingBox // normalized, origin bottom-left
    let top = 1 - (bb.origin.y + bb.height), bottom = 1 - bb.origin.y
    func y(_ region: VNFaceLandmarkRegion2D?) -> Double? {
        guard let r = region else { return nil }
        let pts = r.pointsInImage(imageSize: CGSize(width: W, height: H))
        guard !pts.isEmpty else { return nil }
        let ys = pts.map { 1 - Double($0.y) / Double(H) }
        return ys.reduce(0, +) / Double(ys.count)
    }
    func ymax(_ region: VNFaceLandmarkRegion2D?) -> Double? {
        guard let r = region else { return nil }
        let pts = r.pointsInImage(imageSize: CGSize(width: W, height: H))
        guard !pts.isEmpty else { return nil }
        return pts.map { 1 - Double($0.y) / Double(H) }.max()
    }
    let lm = f.landmarks
    let eyes = y(lm?.leftEye).flatMap { l in y(lm?.rightEye).map { ($0 + l) / 2 } }
    let nose = y(lm?.nose), mouth = y(lm?.outerLips), chin = ymax(lm?.faceContour)
    func s(_ v: Double?) -> String { v.map { String(format: "%.4f", $0) } ?? "null" }
    return "{\"file\":\"\(path)\",\"w\":\(W),\"h\":\(H),\"face\":{\"top\":\(s(top)),\"bottom\":\(s(bottom)),\"left\":\(s(bb.origin.x)),\"right\":\(s(bb.origin.x + bb.width))},\"eyes\":\(s(eyes)),\"nose\":\(s(nose)),\"mouth\":\(s(mouth)),\"chin\":\(s(chin)),\"confidence\":\(String(format: "%.3f", f.confidence))}"
}
for p in CommandLine.arguments.dropFirst() { print(measure(p)) }
