import Foundation
import AVFoundation
import Vision
import CoreImage

// macOS local matting for an already upright, constant-rate production master.
// The same stateful request is reused; each output mask maps to one decoded frame.
func log(_ message: String) { FileHandle.standardError.write(Data((message + "\n").utf8)) }
func generate(_ input: String, _ output: String) throws {
 let asset = AVURLAsset(url: URL(fileURLWithPath: input))
 guard let track = asset.tracks(withMediaType: .video).first else { throw NSError(domain: "No video", code: 1) }
 guard abs(track.nominalFrameRate - 30) < 0.01 else { throw NSError(domain: "Expected 30 fps master", code: 1) }
 let reader = try AVAssetReader(asset: asset)
 let source = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
 source.alwaysCopiesSampleData = false
 reader.add(source)
 guard reader.startReading() else { throw reader.error! }
 let width = 540, height = 960
 let process = Process(), pipe = Pipe()
 process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
 process.arguments = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pixel_format", "gray", "-video_size", "\(width)x\(height)", "-framerate", "30", "-i", "pipe:0", "-an", "-c:v", "ffv1", "-level", "3", "-g", "1", "-pix_fmt", "gray", output]
 process.standardInput = pipe
 process.standardOutput = FileHandle.standardError
 try process.run()
 let request = VNGeneratePersonSegmentationRequest()
 request.qualityLevel = .accurate
 request.outputPixelFormat = kCVPixelFormatType_OneComponent8
 let context = CIContext(options: [.cacheIntermediates: false])
 var frame = 0
 do {
  while let sample = source.copyNextSampleBuffer() {
   try autoreleasepool {
    guard let pixels = CMSampleBufferGetImageBuffer(sample) else { throw NSError(domain: "Missing decoded frame", code: 2) }
    let pts = CMSampleBufferGetPresentationTimeStamp(sample).seconds
    guard abs(pts - Double(frame) / 30) < 0.002 else { throw NSError(domain: "Non-contiguous master frame at \(frame)", code: 2) }
    try VNImageRequestHandler(cvPixelBuffer: pixels, orientation: .up).perform([request])
    guard let result = request.results?.first else { throw NSError(domain: "No person mask at \(frame)", code: 3) }
    let image = CIImage(cvPixelBuffer: result.pixelBuffer)
    let scaled = image.transformed(by: CGAffineTransform(scaleX: CGFloat(width) / image.extent.width, y: CGFloat(height) / image.extent.height))
    var bytes = [UInt8](repeating: 0, count: width * height)
    context.render(scaled, toBitmap: &bytes, rowBytes: width, bounds: CGRect(x: 0, y: 0, width: width, height: height), format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())
    try pipe.fileHandleForWriting.write(contentsOf: Data(bytes))
    frame += 1
    if frame % 30 == 0 { log("Matte: \(frame) frames") }
   }
  }
  try pipe.fileHandleForWriting.close()
  process.waitUntilExit()
  guard reader.status == .completed, process.terminationStatus == 0 else { throw reader.error ?? NSError(domain: "Mask encoder failed", code: 4) }
  log("Matte complete: \(frame) frames, \(width)x\(height), 30 fps")
 } catch {
  try? pipe.fileHandleForWriting.close()
  if process.isRunning { process.terminate() }
  throw error
 }
}
guard CommandLine.arguments.count == 3 else { fatalError("person-matte <upright-master.mp4> <mask.mkv>") }
do { try generate(CommandLine.arguments[1], CommandLine.arguments[2]) }
catch { log("Matte failed: \(error)"); exit(1) }
